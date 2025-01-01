# capture_traffic.py

import pyshark
import sqlite3
from flask import Flask, jsonify, request
import requests
import joblib
import socket
import pandas as pd
from flask_cors import CORS
from datetime import datetime
from flask_socketio import SocketIO, emit

# Initialize Flask app and SocketIO
app = Flask(__name__)
CORS(app)

# Initialize SocketIO with CORS allowed from all origins
socketio = SocketIO(app, cors_allowed_origins="*")

############################################
# 1) Load your final trained pipeline
############################################
# Replace "my_model_pipeline.pkl" with the actual filename if different.
model_pipeline = joblib.load("/Users/syedumer/Desktop/env/Model/my_model_pipeline.pkl")

# Define label mapping
int_to_label = {0: "Normal", 1: "Suspicious"}

# Utility function to get a fresh database connection
def get_db_connection():
    return sqlite3.connect("devices.db")

# Helper: Get trust classification for a MAC address
def get_trust_classification(mac_address):
    mac_address = mac_address.lower()  # Normalize the MAC address
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check if the device is in the trusted table
        cursor.execute("SELECT eth_src FROM trusted_devices WHERE eth_src = ?", (mac_address,))
        if cursor.fetchone():
            return "Trusted"

        # Check if the device is in the blocked table
        cursor.execute("SELECT eth_src FROM blocked_devices WHERE eth_src = ?", (mac_address,))
        if cursor.fetchone():
            return "Blocked"

    # Default to "Unknown" if not found in either table
    return "Unknown"

############################################
# 2) Capture Packets & Predict
############################################
@app.route('/capture', methods=['GET'])
def capture_packets():
    interface = "en0"  # Adjust if necessary
    capture = pyshark.LiveCapture(
        interface=interface,
        bpf_filter="ip",  # Capture all IP traffic
        # promiscuous=True  # Uncomment if promiscuous mode is needed
    )
    packets = []

    try:
        # Capture more packets
        for packet in capture.sniff_continuously(packet_count=100):
            # Ensure packet has Ethernet + IP layers
            if hasattr(packet, 'eth') and hasattr(packet, 'ip'):
                # Extract destination port
                dst_port = None
                for layer in packet.layers:
                    if hasattr(layer, 'dstport'):
                        dst_port = layer.dstport
                        break
                if not dst_port:
                    dst_port = "Unknown"

                # Extract host details
                host = None
                if hasattr(packet, 'dns') and hasattr(packet.dns, 'qry_name'):
                    host = packet.dns.qry_name
                elif hasattr(packet, 'http') and hasattr(packet.http, 'host'):
                    host = packet.http.host
                elif hasattr(packet, 'ssl') and hasattr(packet.ssl, 'handshake_extensions_server_name'):
                    host = packet.ssl.handshake_extensions_server_name

                # Lookup hostname for IP source
                hostname = "Unknown"
                try:
                    hostname = socket.gethostbyaddr(packet.ip.src)[0]
                except (socket.herror, socket.gaierror):
                    hostname = "Unknown"

                # Get trust classification
                trust_classification = get_trust_classification(packet.eth.src)

                # Build packet data
                packet_data = {
                    "eth.src": packet.eth.src.lower(),  # Normalize MAC address
                    "eth.dst": packet.eth.dst.lower() if hasattr(packet, 'eth.dst') else "Unknown",
                    "IP.proto": packet.highest_layer if hasattr(packet, 'highest_layer') else "Unknown",
                    "port.src": getattr(packet, "tcp.srcport", None) or getattr(packet, "udp.srcport", None) or "Unknown",
                    "port.dst": dst_port,
                    "size": int(packet.length) if hasattr(packet, 'length') else 0,
                    "time": packet.sniff_time.isoformat() if hasattr(packet, 'sniff_time') else datetime.now().isoformat(),
                    "host": host or "Unknown",
                    "hostname": hostname,
                    "classification": trust_classification  # from your DB (Trusted/Blocked/Unknown)
                }

                # Insert into packets table
                with get_db_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO packets (eth_src, eth_dst, IP_proto, port_src, port_dst, size, time)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        packet_data["eth.src"],
                        packet_data["eth.dst"],
                        packet_data["IP.proto"],
                        packet_data["port.src"],
                        packet_data["port.dst"],
                        packet_data["size"],
                        packet_data["time"]
                    ))
                    conn.commit()

                # Prepare data for model
                time_iso = packet_data["time"]
                try:
                    time_numeric = datetime.fromisoformat(time_iso).timestamp()
                except ValueError:
                    time_numeric = 0.0

                model_input = pd.DataFrame([{
                    "Destination MAC": packet_data["eth.dst"],
                    "Protocol": packet_data["IP.proto"],
                    "Port Dst": packet_data["port.dst"],
                    "Size": packet_data["size"],
                    "Time_numeric": time_numeric
                }])

                # Run inference
                model_pred = model_pipeline.predict(model_input)[0]
                behavior_label = int_to_label.get(model_pred, "Unknown")
                packet_data["behavior_prediction"] = behavior_label
                # For testing purposes, you can manually set behavior_prediction
                #packet_data["behavior_prediction"] = "Suspicious"

                # Append to output
                packets.append(packet_data)

                # Emit SocketIO event if behavior is Suspicious
                if behavior_label == "Suspicious":
                    alarm_type = "New Suspicious Device" if trust_classification == "Unknown" else "Existing Device Suspicious"
                    alert_message = ""
                    if alarm_type == "New Suspicious Device":
                        alert_message = f"New device with MAC {packet_data['eth.src']} is exhibiting suspicious behavior."
                    else:
                        alert_message = f"Device with MAC {packet_data['eth.src']} has become suspicious."

                    # Emit the 'suspicious_behavior' event with relevant data
                    socketio.emit('suspicious_behavior', {
                        "mac": packet_data["eth.src"],
                        "type": alarm_type,
                        "message": alert_message,
                        "time": packet_data["time"]
                    })

        print(f"Total packets captured: {len(packets)}")
        unique_macs = set(packet["eth.src"] for packet in packets)
        print(f"Unique MAC addresses captured: {len(unique_macs)} - {unique_macs}")

    except Exception as e:
        print(f"Error capturing packets: {e}")
        return jsonify({"error": str(e)}), 500

    # Return the packets (including behavior prediction) as JSON
    return jsonify(packets)

# Optionally, you can add an endpoint to retrieve alert history if you implement it
# For now, focus on real-time alerts

if __name__ == "__main__":
    # Use socketio.run instead of app.run
    socketio.run(app, debug=True, port=5001)

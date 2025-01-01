from flask import Response
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user
)
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import sqlite3
import atexit

app = Flask(__name__)
app.secret_key = "your_secret_key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Enable CORS
CORS(app, supports_credentials=True)

# Initialize the database
db = SQLAlchemy(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)

# Create the database tables
with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def get_db_connection():
    return sqlite3.connect("devices.db")

# ----------------------
#  Registration & Login
# ----------------------
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        hashed_password = generate_password_hash(data["password"], method="pbkdf2:sha256")
        new_user = User(username=data["username"], password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully!"})
    except Exception as e:
        return jsonify({"message": "Error registering user", "error": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        user = User.query.filter_by(username=data["username"]).first()
        if not user or not check_password_hash(user.password, data["password"]):
            return jsonify({"message": "Invalid credentials!"}), 401
        login_user(user)
        return jsonify({"message": "Logged in successfully!", "username": user.username})
    except Exception as e:
        return jsonify({"message": "Error logging in", "error": str(e)}), 500

@app.route("/logout", methods=["POST"])
@login_required
def logout():
    try:
        logout_user()
        return jsonify({"message": "Logged out successfully!"})
    except Exception as e:
        return jsonify({"message": "Error logging out", "error": str(e)}), 500
    

@app.route("/update-profile-picture", methods=["POST"])
@login_required
def update_profile_picture():
    """
    Endpoint to update the user's profile picture.
    """
    try:
        if "profilePicture" not in request.files:
            return jsonify({"error": "No file provided."}), 400

        file = request.files["profilePicture"]
        filename = f"profile_{current_user.id}.jpg"
        filepath = f"profile_pictures/{filename}"

        # Save the file
        file.save(filepath)
        return jsonify({"message": "Profile picture updated successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/update-username", methods=["POST"])
@login_required
def update_username():
    """
    Endpoint to update the user's username.
    """
    try:
        data = request.json
        new_username = data.get("username")

        if not new_username:
            return jsonify({"error": "Username is required."}), 400

        # Update the username in the database
        user = User.query.get(current_user.id)
        user.username = new_username
        db.session.commit()
        return jsonify({"message": "Username updated successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/update-password", methods=["POST"])
@login_required
def update_password():
    """
    Endpoint to update the user's password.
    """
    try:
        data = request.json
        new_password = data.get("password")

        if not new_password:
            return jsonify({"error": "Password is required."}), 400

        # Update the password in the database
        user = User.query.get(current_user.id)
        user.password = generate_password_hash(new_password, method="pbkdf2:sha256")
        db.session.commit()
        return jsonify({"message": "Password updated successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------------------
#  Table Creation
# ----------------------
@app.before_request
def create_tables():
    # Creates the necessary tables if they don't exist
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS trusted_devices (
            eth_src TEXT PRIMARY KEY
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocked_devices (
            eth_src TEXT PRIMARY KEY
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS packets (
            eth_src TEXT,
            eth_dst TEXT,
            IP_proto TEXT,
            port_src TEXT,
            port_dst TEXT,
            size INTEGER,
            time TEXT
        )
        """)
        conn.commit()

# Normalize MAC addresses
@app.before_request
def normalize_mac_addresses_on_startup():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE trusted_devices SET eth_src = LOWER(eth_src)")
            cursor.execute("UPDATE blocked_devices SET eth_src = LOWER(eth_src)")
            conn.commit()
    except Exception as e:
        print(f"Error normalizing MAC addresses: {e}")

# ----------------------
#  Device Stats
# ----------------------
@app.route("/device_stats", methods=["GET"])
def device_stats():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Count how many are in trusted
            cursor.execute("SELECT COUNT(*) FROM trusted_devices")
            trusted_count = cursor.fetchone()[0]

            # Count how many are in blocked
            cursor.execute("SELECT COUNT(*) FROM blocked_devices")
            blocked_count = cursor.fetchone()[0]

            # Find all devices that appear in 'packets'
            cursor.execute("SELECT DISTINCT eth_src FROM packets")
            all_devices = {row[0].lower() for row in cursor.fetchall()}

            cursor.execute("SELECT eth_src FROM trusted_devices")
            trusted_devices = {row[0].lower() for row in cursor.fetchall()}

            cursor.execute("SELECT eth_src FROM blocked_devices")
            blocked_devices = {row[0].lower() for row in cursor.fetchall()}

            # Unknown = all_devices - (trusted + blocked)
            unknown_count = len(all_devices - trusted_devices - blocked_devices)

        return jsonify({
            "trusted": trusted_count,
            "blocked": blocked_count,
            "unknown": unknown_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------
#  Update Device (Trust / Block)
# ----------------------
@app.route("/update_device", methods=["POST"])
def update_device():
    """
    Action can be either "trust" or "block".
    Ensure a device is only in one table (trusted or blocked) at a time.
    """
    try:
        data = request.json
        eth_src = data.get("eth_src", "").lower()
        action = data.get("action")

        if not eth_src:
            return jsonify({"error": "No eth_src provided"}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()

            if action == "trust":
                # Remove from blocked if it was there
                cursor.execute("DELETE FROM blocked_devices WHERE eth_src = ?", (eth_src,))
                # Insert into trusted
                cursor.execute("INSERT OR IGNORE INTO trusted_devices (eth_src) VALUES (?)", (eth_src,))
                message = f"Device {eth_src} has been trusted."
            elif action == "block":
                # Remove from trusted if it was there
                cursor.execute("DELETE FROM trusted_devices WHERE eth_src = ?", (eth_src,))
                # Insert into blocked
                cursor.execute("INSERT OR IGNORE INTO blocked_devices (eth_src) VALUES (?)", (eth_src,))
                message = f"Device {eth_src} has been blocked."
            else:
                raise ValueError("Invalid action. Must be 'trust' or 'block'.")

            conn.commit()

        return jsonify({"message": message})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------------------
#  Get Devices (Trusted / Blocked / Unknown)
# ----------------------
@app.route("/get_devices", methods=["GET"])
def get_devices():
    category = request.args.get("category")
    devices = []

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            if category == "trusted":
                cursor.execute("SELECT eth_src FROM trusted_devices")
                devices = [row[0].lower() for row in cursor.fetchall()]

            elif category == "blocked":
                cursor.execute("SELECT eth_src FROM blocked_devices")
                devices = [row[0].lower() for row in cursor.fetchall()]

            elif category == "unknown":
                # unknown = all in 'packets' - trusted - blocked
                cursor.execute("SELECT DISTINCT eth_src FROM packets")
                all_devices = {row[0].lower() for row in cursor.fetchall()}

                cursor.execute("SELECT eth_src FROM trusted_devices")
                trusted_devices = {row[0].lower() for row in cursor.fetchall()}

                cursor.execute("SELECT eth_src FROM blocked_devices")
                blocked_devices = {row[0].lower() for row in cursor.fetchall()}

                unknown_devices = all_devices - trusted_devices - blocked_devices
                devices = list(unknown_devices)

            else:
                raise ValueError("Invalid category. Must be 'trusted', 'blocked', or 'unknown'.")

        return jsonify({"devices": devices})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Store incoming packet data
@app.route("/store_packet", methods=["POST"])
def store_packet():
    try:
        data = request.json
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO packets (eth_src, eth_dst, IP_proto, port_src, port_dst, size, time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get("eth_src", "").lower(),
                data.get("eth_dst", "").lower(),
                data.get("IP_proto", ""),
                data.get("port_src", ""),
                data.get("port_dst", ""),
                data.get("size", 0),
                data.get("time", ""),
            ))
            conn.commit()
        return jsonify({"message": "Packet stored successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_all_packets", methods=["GET"])
def get_all_packets():
    try:
        eth_src = request.args.get("eth_src")
        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")

        query = """
        SELECT packets.eth_src, packets.eth_dst, packets.IP_proto, packets.port_dst, 
               packets.size, packets.time,
               CASE 
                   WHEN trusted_devices.eth_src IS NOT NULL THEN 'Trusted'
                   WHEN blocked_devices.eth_src IS NOT NULL THEN 'Blocked'
                   ELSE 'Unknown'
               END AS classification
        FROM packets
        LEFT JOIN trusted_devices ON packets.eth_src = trusted_devices.eth_src
        LEFT JOIN blocked_devices ON packets.eth_src = blocked_devices.eth_src
        WHERE 1=1
        """
        params = []

        if eth_src:
            query += " AND packets.eth_src = ?"
            params.append(eth_src.lower())
        if date_from:
            query += " AND packets.time >= ?"
            params.append(date_from)
        if date_to:
            query += " AND packets.time <= ?"
            params.append(date_to)

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()

        # Map the query results to JSON
        return jsonify([
            {
                "eth_src": row[0],
                "eth_dst": row[1],
                "IP_proto": row[2],
                "port_dst": row[3],  # Include port_dst
                "size": row[4],
                "time": row[5],
                "classification": row[6],
            }
            for row in rows
        ])
    except Exception as e:
        print(f"Error in /get_all_packets: {e}")
        return jsonify({"error": str(e)}), 500



@app.route("/export_packets", methods=["GET"])
def export_packets():
    try:
        # SQL query to get packets with classification
        query = """
        SELECT packets.eth_src, packets.eth_dst, packets.IP_proto, packets.port_dst, 
               packets.size, packets.time,
               CASE 
                   WHEN trusted_devices.eth_src IS NOT NULL THEN 'Trusted'
                   WHEN blocked_devices.eth_src IS NOT NULL THEN 'Blocked'
                   ELSE 'Unknown'
               END AS classification
        FROM packets
        LEFT JOIN trusted_devices ON packets.eth_src = trusted_devices.eth_src
        LEFT JOIN blocked_devices ON packets.eth_src = blocked_devices.eth_src
        """

        # Generator function to yield rows as CSV lines
        def generate_csv():
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query)
                rows = cursor.fetchall()

            # Yield CSV header
            yield "Source MAC,Destination MAC,Protocol,Port Dst,Size,Time,Access\n"  # Remove Port Src
            for row in rows:
                csv_row = ",".join([str(value) for value in row])
                yield csv_row + "\n"

        # Use Flask's Response to stream the CSV data
        return Response(generate_csv(), mimetype="text/csv", headers={
            "Content-Disposition": "attachment; filename=packets_report.csv"
        })

    except Exception as e:
        print(f"Error in /export_packets: {e}")
        return jsonify({"error": str(e)}), 500
    
# In-memory storage for blocked MAC addresses
blocked_devices = set()

@app.route("/get_blocked_devices", methods=["GET"])
def get_blocked_devices():
    """
    Fetch the list of blocked MAC addresses.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT eth_src FROM blocked_devices")
            devices = [row[0].lower() for row in cursor.fetchall()]
        return jsonify(devices), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/block-device", methods=["POST"])
def block_device():
    """
    Block a MAC address by adding it to the blocked_devices table.
    """
    try:
        data = request.json
        mac_address = data.get("macAddress", "").lower()

        if not mac_address:
            return jsonify({"error": "MAC Address is required."}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Remove from trusted_devices if present
            cursor.execute("DELETE FROM trusted_devices WHERE eth_src = ?", (mac_address,))
            # Add to blocked_devices
            cursor.execute("INSERT OR IGNORE INTO blocked_devices (eth_src) VALUES (?)", (mac_address,))
            conn.commit()

        return jsonify({"message": f"Device {mac_address} has been blocked."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/unblock-device", methods=["POST"])
def unblock_device():
    """
    Unblock a MAC address by removing it from the blocked_devices table
    and adding it to the trusted_devices table.
    """
    try:
        data = request.json
        mac_address = data.get("macAddress", "").lower()

        if not mac_address:
            return jsonify({"error": "MAC Address is required."}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Remove from blocked_devices
            cursor.execute("DELETE FROM blocked_devices WHERE eth_src = ?", (mac_address,))

            # Add to trusted_devices
            cursor.execute("INSERT OR IGNORE INTO trusted_devices (eth_src) VALUES (?)", (mac_address,))
            conn.commit()

        return jsonify({"message": f"Device {mac_address} has been moved to Trusted devices."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@atexit.register
def close_db_connection():
    """Close the database connection on application shutdown."""
    print("Database connections are closed cleanly.")

if __name__ == "__main__":
    app.run(debug=True)

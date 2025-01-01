// src/components/Traffic.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Traffic.css";
import { CircularProgress } from "@mui/material"; // Import CircularProgress for loading indicator

const Traffic = () => {
  const [packets, setPackets] = useState([]);
  const [groupedPackets, setGroupedPackets] = useState([]);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(false);

  const [alarms, setAlarms] = useState([]); // Changed from alertMessage to alarms array
  const [deviceStates, setDeviceStates] = useState({});
  const [macClassificationMap, setMacClassificationMap] = useState({});

  const [previousGroupedPackets, setPreviousGroupedPackets] = useState({}); // New state for previous devices

  const navigate = useNavigate();

  const fetchClassifications = async () => {
    try {
      const [trustedRes, blockedRes, unknownRes] = await Promise.all([
        axios.get("http://127.0.0.1:5000/get_devices?category=trusted"),
        axios.get("http://127.0.0.1:5000/get_devices?category=blocked"),
        axios.get("http://127.0.0.1:5000/get_devices?category=unknown"),
      ]);

      const map = {};
      trustedRes.data.devices.forEach((mac) => {
        map[mac.toLowerCase()] = "Trusted";
      });
      blockedRes.data.devices.forEach((mac) => {
        map[mac.toLowerCase()] = "Blocked";
      });
      unknownRes.data.devices.forEach((mac) => {
        map[mac.toLowerCase()] = "Unknown";
      });
      console.log("Classification Map:", map); // Inspect classification map
      return map;
    } catch (err) {
      console.error("Failed to fetch classifications:", err);
      throw err;
    }
  };

  const fetchTrafficRaw = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/capture");
      console.log("Raw Traffic Data:", response.data); // Inspect raw data
      return response.data;
    } catch (err) {
      console.error("Failed to fetch raw traffic data:", err);
      throw err;
    }
  };

  const mergeClassification = (rawTraffic, classificationMap) => {
    const merged = rawTraffic.map((packet) => {
      const macField = "eth.src"; // Adjust if the MAC address is under a different field
      const mac = (packet[macField] || "").toLowerCase().trim();
      const classification = classificationMap[mac] || "Unknown";
      const behavior = packet.behavior_prediction || "N/A";
      const size = parseFloat(packet.size) || 0; // Ensure size is a number
      return {
        ...packet,
        mac,
        classification,
        behavior,
        size,
      };
    });
    console.log("Merged Traffic Data:", merged); // Inspect merged data
    return merged;
  };

  const groupByDevice = (packets) => {
    const deviceMap = {};
    packets.forEach((packet) => {
      const mac = packet.mac;
      if (!mac) {
        console.warn("Encountered packet with no MAC address:", packet);
        return; // Skip if MAC is empty
      }
      if (!deviceMap[mac]) {
        deviceMap[mac] = {
          mac,
          sizeSum: 0,
          sizeCount: 0,
          classification: packet.classification,
          behavior: packet.behavior,
        };
      }
      deviceMap[mac].sizeSum += packet.size || 0;
      deviceMap[mac].sizeCount += 1;
    });

    const grouped = Object.values(deviceMap).map((device) => ({
      mac: device.mac,
      averageSize: device.sizeCount > 0 ? device.sizeSum / device.sizeCount : 0,
      classification: device.classification,
      behavior: device.behavior,
    }));
    console.log("Grouped Packets:", grouped); // Inspect grouped data
    return grouped;
  };

  const detectAlarms = (currentGrouped, previousGrouped) => {
    const alarms = [];

    currentGrouped.forEach(device => {
      const prev = previousGrouped[device.mac];

      // Check if device is new (previously not present)
      if (!prev) {
        if (device.behavior === "Suspicious") {
          alarms.push({
            type: "New Suspicious Device",
            message: `New device with MAC ${device.mac} is exhibiting suspicious behavior.`
          });
        }
      } else {
        // Device existed before
        if (prev.behavior !== "Suspicious" && device.behavior === "Suspicious") {
          alarms.push({
            type: "Existing Device Suspicious",
            message: `Device with MAC ${device.mac} has become suspicious.`
          });
        }
      }
    });

    return alarms;
  };

  const fetchTraffic = async () => {
    setLoading(true);
    setError("");
    setAlarms([]); // Reset alarms on new fetch
    try {
      const [classMap, rawPackets] = await Promise.all([
        fetchClassifications(),
        fetchTrafficRaw(),
      ]);

      const merged = mergeClassification(rawPackets, classMap);

      const grouped = groupByDevice(merged);
      setPackets(merged);
      setGroupedPackets(grouped);

      setMacClassificationMap(classMap);
      setLastRefresh(new Date());

      // Detect alarms
      const detectedAlarms = detectAlarms(grouped, previousGroupedPackets);
      if (detectedAlarms.length > 0) {
        setAlarms(detectedAlarms);
      }

      // Update previousGroupedPackets
      const newPrevious = {};
      grouped.forEach(device => {
        newPrevious[device.mac] = {
          classification: device.classification,
          behavior: device.behavior
        };
      });
      setPreviousGroupedPackets(newPrevious);
    } catch (err) {
      setError("Failed to fetch traffic data.");
      console.error("Traffic fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
    const interval = setInterval(() => {
      fetchTraffic();
    }, 5 * 60 * 1000); // Fetch every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleSourceClick = (macAddress) => {
    navigate(`/device/${macAddress}`);
  };

  return (
    <div className="traffic-container">
      {alarms.length > 0 && (
        <div className="alarm-popup">
          {alarms.map((alarm, index) => (
            <div key={index} className={`alarm-message ${alarm.type === "New Suspicious Device" ? "new-suspicious" : "existing-suspicious"}`}>
              <p>{alarm.message}</p>
            </div>
          ))}
          <button className="alarm-close-btn" onClick={() => setAlarms([])}>
            Close
          </button>
        </div>
      )}

      <h2 className="traffic-title">Live Traffic Data</h2>

      <div className="controls">
        <button onClick={fetchTraffic} className="refresh-button" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        {lastRefresh && (
          <p className="last-refresh">
            Last Refresh: {lastRefresh.toLocaleString()}
          </p>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      ) : (
        <table className="traffic-table">
          <thead>
            <tr>
              <th>MAC Address</th>
              <th>Average Size (Bytes)</th>
              <th>Access</th>
              <th>Behaviour</th>
            </tr>
          </thead>
          <tbody>
            {groupedPackets.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  No traffic data available.
                </td>
              </tr>
            ) : (
              groupedPackets.map((device) => (
                <tr key={device.mac} className={device.behavior === "Suspicious" ? "suspicious-row" : ""}>
                  <td>
                    <button
                      className="source-link"
                      onClick={() => handleSourceClick(device.mac)}
                      aria-label={`View details for MAC ${device.mac}`}
                    >
                      {device.mac}
                    </button>
                  </td>
                  <td>{device.averageSize.toFixed(2)}</td>
                  <td>{device.classification}</td>
                  <td>{device.behavior}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Traffic;

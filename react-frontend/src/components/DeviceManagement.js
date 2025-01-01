import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DeviceManagement.css";

const DeviceManagement = () => {
  const [macAddress, setMacAddress] = useState("");
  const [action, setAction] = useState("block"); // Default action is Block
  const [responseMessage, setResponseMessage] = useState("");
  const [blockedDevices, setBlockedDevices] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/device_stats");
      console.log("Stats:", res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchBlockedDevices = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_blocked_devices");
      if (!response.ok) throw new Error("Failed to fetch blocked devices.");
      const data = await response.json();
      // Normalize all MAC addresses to uppercase for consistent comparison
      const normalizedData = (data || []).map((mac) => mac.toUpperCase());
      setBlockedDevices(normalizedData);
    } catch (error) {
      console.error("Error fetching blocked devices:", error);
    }
  };

  const validateMacAddress = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:\-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateMacAddress(macAddress)) {
      setResponseMessage("Error: Invalid MAC address format.");
      return;
    }

    const normalizedMacAddress = macAddress.toUpperCase();

    if (action === "block") {
      // Check for duplicates before blocking
      if (blockedDevices.includes(normalizedMacAddress)) {
        setResponseMessage("Error: This MAC address is already blocked.");
        return;
      }
    }

    const endpoint =
      action === "block"
        ? "http://127.0.0.1:5000/block-device"
        : "http://127.0.0.1:5000/unblock-device";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ macAddress: normalizedMacAddress }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Request failed");

      setResponseMessage(data.message);
      setMacAddress(""); // Clear the input field
      fetchBlockedDevices(); // Refresh the blocked devices list
    } catch (error) {
      console.error("Error managing device:", error);
      setResponseMessage("Error: Unable to process the request.");
    }
  };

  const handleUnblock = async (macAddress) => {
    const normalizedMacAddress = macAddress.toUpperCase(); // Ensure normalization for consistency
    try {
      const res = await axios.post("http://127.0.0.1:5000/unblock-device", {
        macAddress: normalizedMacAddress,
      });
      setResponseMessage(res.data.message);

      fetchBlockedDevices();
      fetchStats();
    } catch (error) {
      setResponseMessage("Error: Unable to unblock the device.");
      console.error("Error unblocking device:", error);
    }
  };

  useEffect(() => {
    fetchBlockedDevices();
  }, []);

  return (
    <div className="device-management">
      <h2>Device Management</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="mac-address">MAC Address:</label>
        <input
          type="text"
          id="mac-address"
          value={macAddress}
          onChange={(e) => setMacAddress(e.target.value)}
          placeholder="XX:XX:XX:XX:XX:XX"
          required
        />

        <label htmlFor="action">Action:</label>
        <select
          id="action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="block">Block</option>
          <option value="unblock">Unblock</option>
        </select>

        <button type="submit">Submit</button>
      </form>

      {responseMessage && (
        <p
          className={`response ${
            responseMessage.startsWith("Error") ? "error" : "success"
          }`}
        >
          {responseMessage}
        </p>
      )}

      {blockedDevices.length > 0 && (
        <table className="blocked-devices-table">
          <thead>
            <tr>
              <th>MAC Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {blockedDevices.map((device, index) => (
              <tr key={index}>
                <td>{device}</td>
                <td>
                  <button
                    className="unblock-button"
                    onClick={() => handleUnblock(device)}
                  >
                    Unblock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeviceManagement;

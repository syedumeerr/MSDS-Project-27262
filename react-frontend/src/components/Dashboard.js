import React, { useEffect, useState } from "react";
import axios from "axios";
import Traffic from "./Traffic";
import Notification from "./Notification";
import "./Dashboard.css";

const Dashboard = () => {
  // Stats for counters
  const [stats, setStats] = useState({ trusted: 0, blocked: 0, unknown: 0 });

  // List of devices based on selected category (trusted, unknown, blocked)
  const [deviceList, setDeviceList] = useState([]);

  // We won’t show an error on screen, but we keep it in state if needed
  const [, setError] = useState("");

  // Active category to show the modal for (trusted, unknown, blocked)
  const [activeCategory, setActiveCategory] = useState(null);

  // Position of the device modal (below & centered on the clicked block)
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  // -------------------------------------------------
  // 1) Scroll listener to "stick" the modal to its block
  // -------------------------------------------------
  useEffect(() => {
    function handleScroll() {
      if (!activeCategory) return;
      const block = document.querySelector(`.stat-block.${activeCategory}`);
      if (!block) return;

      const blockRect = block.getBoundingClientRect();
      setModalPosition({
        top: blockRect.top + window.scrollY + blockRect.height + 10,
        left: blockRect.left + window.scrollX + blockRect.width / 2,
      });
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeCategory]);

  // -------------------------------------------------
  // 2) Close the modal if user clicks outside of it
  // -------------------------------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      if (!activeCategory) return;
      const modalEl = document.querySelector(".device-modal");
      if (!modalEl) return;
      if (!modalEl.contains(event.target)) {
        setActiveCategory(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeCategory]);

  // Fetch stats for the counters
  const fetchStats = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/device_stats");
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Fetch the devices for a given category
  const fetchDevices = async (category) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/get_devices?category=${category}`
      );
      setDeviceList(response.data.devices);
    } catch (err) {
      console.error(`Failed to fetch ${category} devices:`, err);
      setError(`Failed to fetch ${category} devices.`);
    }
  };

  // On block click, open the modal and fetch devices
  const handleStatClick = async (category, event) => {
    setActiveCategory(category);
    const blockRect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      top: blockRect.top + window.scrollY + blockRect.height + 10,
      left: blockRect.left + window.scrollX + blockRect.width / 2,
    });
    fetchDevices(category);
  };

  // Handle trust/block actions from the device list
  const handleDeviceAction = async (ethSrc, action) => {
    try {
      await axios.post("http://127.0.0.1:5000/update_device", {
        eth_src: ethSrc,
        action: action,
      });
      Notification.success(`${ethSrc} has been marked as ${action}.`);
      fetchDevices(activeCategory);
      fetchStats();
    } catch (err) {
      console.error(`Failed to update device ${ethSrc}:`, err);
      Notification.error("Failed to update device. Please try again.");
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      {/* Counter Blocks */}
      <div className="stats-container">
        <div
          className="stat-block trusted"
          style={{ backgroundColor: "#d4edda", color: "#155724" }}
          onClick={(e) => handleStatClick("trusted", e)}
        >
          <h3>Trusted Devices</h3>
          <p>{stats.trusted}</p>
        </div>
        <div
          className="stat-block unknown"
          style={{ backgroundColor: "#fff3cd", color: "#856404" }}
          onClick={(e) => handleStatClick("unknown", e)}
        >
          <h3>Unknown Devices</h3>
          <p>{stats.unknown}</p>
        </div>
        <div
          className="stat-block blocked"
          style={{ backgroundColor: "#f8d7da", color: "#721c24" }}
          onClick={(e) => handleStatClick("blocked", e)}
        >
          <h3>Blocked Devices</h3>
          <p>{stats.blocked}</p>
        </div>
      </div>

      {/* Device Modal */}
      {activeCategory && (
        <div
          className={`device-modal ${activeCategory}`}
          style={{
            top: modalPosition.top,
            left: modalPosition.left,
          }}
        >
          <h3>
            {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Devices
          </h3>
          <ul className="device-list">
            {deviceList.map((device) => (
              <li key={device}>
                {device}
                {activeCategory === "unknown" && (
                  <>
                    <button onClick={() => handleDeviceAction(device, "trust")}>
                      Trust
                    </button>
                    <button onClick={() => handleDeviceAction(device, "block")}>
                      Block
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <button onClick={() => setActiveCategory(null)}>Close</button>
        </div>
      )}

      {/* Traffic Table */}
      <Traffic />
    </div>
  );
};

export default Dashboard;

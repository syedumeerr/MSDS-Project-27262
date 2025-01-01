import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TrafficGraph.css";

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

const TrafficGraph = () => {
  const { macAddress } = useParams();
  const navigate = useNavigate();

  const [livePackets, setLivePackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshInterval = useRef(null);
  const graphTimeWindow = 60 * 1000; // Show last 60 seconds of data in graph
  const tableTimeWindow = 10 * 1000; // Show last 10 seconds of data in table

  const fetchClassifications = async () => {
    const [trustedRes, blockedRes, unknownRes] = await Promise.all([
      axios.get("http://127.0.0.1:5000/get_devices?category=trusted"),
      axios.get("http://127.0.0.1:5000/get_devices?category=blocked"),
      axios.get("http://127.0.0.1:5000/get_devices?category=unknown"),
    ]);

    const map = {};
    trustedRes.data.devices.forEach((mac) => {
      map[mac] = "Trusted";
    });
    blockedRes.data.devices.forEach((mac) => {
      map[mac] = "Blocked";
    });
    unknownRes.data.devices.forEach((mac) => {
      map[mac] = "Unknown";
    });
    return map;
  };

  const fetchLivePacketsRaw = async () => {
    const response = await axios.get("http://127.0.0.1:5001/capture");
    return response.data.filter(
      (p) => (p["eth.src"] || "").toLowerCase() === macAddress.toLowerCase()
    );
  };

  const mergeClassification = (rawPackets, classMap) => {
    return rawPackets.map((p) => {
      const mac = (p["eth.src"] || "").toLowerCase();
      const access = classMap[mac] || "Unknown";
      return {
        ...p,
        time: new Date(p.time),
        size: p.size || 0,
        mac,
        access,
      };
    });
  };

  const fetchLivePackets = async () => {
    try {
      const [classMap, rawPackets] = await Promise.all([
        fetchClassifications(),
        fetchLivePacketsRaw(),
      ]);

      const merged = mergeClassification(rawPackets, classMap);

      setLivePackets((prev) => {
        const combined = [...prev, ...merged];
        const cutoff = Date.now() - graphTimeWindow;
        return combined.filter((pkt) => pkt.time.getTime() > cutoff);
      });
    } catch (err) {
      console.error("Error fetching live traffic:", err);
      setError("Failed to load traffic data.");
    } finally {
      setLoading(false);
    }
  };

  const groupPacketsBySecond = (packets) => {
    const grouped = {};
    packets.forEach((packet) => {
      const secondTimestamp = new Date(
        packet.time.getFullYear(),
        packet.time.getMonth(),
        packet.time.getDate(),
        packet.time.getHours(),
        packet.time.getMinutes(),
        packet.time.getSeconds()
      ).getTime();

      if (!grouped[secondTimestamp]) {
        grouped[secondTimestamp] = {
          time: new Date(secondTimestamp),
          mac: packet.mac,
          size: 0,
          access: packet.access,
          behavior: packet.behavior_prediction || "N/A",
        };
      }

      grouped[secondTimestamp].size += packet.size;
    });

    return Object.values(grouped);
  };

  useEffect(() => {
    fetchLivePackets();
    refreshInterval.current = setInterval(fetchLivePackets, 2000);

    return () => clearInterval(refreshInterval.current);
  }, []);

  if (loading) return <p>Loading traffic data...</p>;
  if (error) return <p className="traffic-error">{error}</p>;
  if (livePackets.length === 0) {
    return <p>No traffic data available for {macAddress}.</p>;
  }

  const datasets = [
    {
      label: "All Packets",
      data: livePackets.map((pkt) => ({
        x: pkt.time,
        y: pkt.size,
      })),
      borderColor: "#8b86f8",
      tension: 0.4,
      borderWidth: 2,
    },
  ];

  const chartData = { datasets };
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Live Traffic for ${macAddress} (Last 60s)`,
        font: { size: 20 },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "second",
          stepSize: 5,
          displayFormats: { second: "HH:mm:ss" },
        },
      },
      y: {
        title: {
          display: true,
          text: "Packet Size (Bytes)",
        },
      },
    },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
  };

  const tablePackets = groupPacketsBySecond(
    livePackets.filter((pkt) => pkt.time.getTime() > Date.now() - tableTimeWindow)
  );

  return (
    <div className="traffic-graph-container">
      <button className="back-button" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>
      <h3 className="traffic-graph-title">
        Live Traffic Visualization for {macAddress}
      </h3>
      <Line data={chartData} options={options} />

      <h3 className="details-title">Packet Details (Last 10 Seconds)</h3>
      <table className="details-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>MAC Address</th>
            <th>Size (Bytes)</th>
            <th>Access</th>
            <th>Behaviour</th>
          </tr>
        </thead>
        <tbody>
          {tablePackets.map((packet, index) => (
            <tr key={index}>
              <td>{packet.time.toLocaleString()}</td>
              <td>{packet.mac}</td>
              <td>{packet.size}</td>
              <td>{packet.access}</td>
              <td>{packet.behavior}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrafficGraph;

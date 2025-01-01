import React, { useState,  } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ReportPage.css";

const ReportPage = () => {
  const navigate = useNavigate();
  const [packets, setPackets] = useState([]);
  const [filters, setFilters] = useState({ eth_src: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch all packets with filters
  const fetchPackets = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/get_all_packets", {
        params: filters,
      });
      setPackets(response.data);
    } catch (err) {
      console.error("Failed to fetch packets:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    setDownloading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/export_packets", {
        responseType: "blob", // Ensure we handle the response as a binary file
      });
  
      // Create file name with current date
      const date = new Date().toISOString().split("T")[0];
      const fileName = `packets_report_${date}.csv`;
  
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export packets:", err);
      alert("Failed to download CSV. Please try again.");
    } finally {
      setDownloading(false);
    }
  };
  

  // useEffect(() => {
  //   fetchPackets();
  // }, []);

  return (
    <div className="report-container">
      <div className="header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <h2>Device Traffic Report</h2>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Filter by MAC Address"
          className="filter-input"
          value={filters.eth_src}
          onChange={(e) => setFilters({ ...filters, eth_src: e.target.value })}
        />
        <input
          type="date"
          className="filter-input"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
        />
        <input
          type="date"
          className="filter-input"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
        />
        <button className="action-button" onClick={fetchPackets} disabled={loading}>
          {loading ? "Loading..." : "Apply Filters"}
        </button>
        <button className="download-button" onClick={exportToCSV} disabled={downloading}>
          {downloading ? "Downloading..." : "Download CSV"}
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
  <table className="report-table">
    <thead>
      <tr>
        <th>Time</th>
        <th>Source MAC Address</th>
        <th>Destination Address</th>
        <th>Protocol</th>
        <th>Size</th>
        <th>Port Dst</th> {/* Add Port Dst column */}
        <th>Access</th>
      </tr>
    </thead>
    <tbody>
      {packets.length === 0 ? (
        <tr>
          <td colSpan="7" className="no-data">No data available</td> {/* Update colSpan */}
        </tr>
      ) : (
        packets.map((packet, index) => (
          <tr key={index}>
            <td>{new Date(packet.time).toLocaleString()}</td>
            <td>{packet.eth_src}</td>
            <td>{packet.eth_dst || "Unknown"}</td>
            <td>{packet.IP_proto || "Unknown"}</td>
            <td>{packet.size || "N/A"}</td>
            <td>{packet.port_dst || "N/A"}</td> {/* Render Port Dst */}
            <td>{packet.classification || "Unknown"}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

    </div>
  );
};

export default ReportPage;

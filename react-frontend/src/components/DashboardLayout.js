// src/components/DashboardLayout.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardLayout.css";
import { Button } from "@mui/material";
import { AuthContext } from "../AuthContext";

const DashboardLayout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { handleLogout, username } = useContext(AuthContext);

  return (
    <div className="dashboard-layout">
      {/* Header Bar */}
      <header className="header-bar">
        <div className="header-logo" onClick={() => navigate("/")}>
          <i className="fas fa-network-wired"></i>
          <span className="header-title">MultiLayer AI</span>
        </div>

        <div className="header-profile">
          <span>Welcome, {username}!</span>
          <Button
            variant="contained"
            onClick={handleLogout}
            sx={{
              marginLeft: 2,
              backgroundColor: "#ff4d4d", // Logout button red color
              color: "#fff",
              fontWeight: "bold",
              textTransform: "none", // Keep text as is
              "&:hover": {
                backgroundColor: "#e60000", // Darker shade on hover
              },
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <div
        className={`sidebar ${isExpanded ? "expanded" : ""}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="sidebar-indicator"></div>
        <div className="sidebar-title">Menu</div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate("/")}>
            <i className="fas fa-home"></i>
            <span>Home</span>
          </li>
          <li onClick={() => navigate("/report")}>
            <i className="fas fa-file-alt"></i>
            <span>Report</span>
          </li>
          <li onClick={() => navigate("/device-management")}>
            <i className="fas fa-laptop"></i>
            <span>Device Management</span>
          </li>
          <li onClick={() => navigate("/website-management")}>
            <i className="fas fa-globe"></i>
            <span>Website Management</span>
          </li>
          <li onClick={() => navigate("/settings")}>
            <i className="fas fa-cogs"></i>
            <span>Settings</span>
          </li>
          <li onClick={() => navigate("/about")}>
            <i className="fas fa-info-circle"></i>
            <span>About</span>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">{children}</div>
    </div>
  );
};

export default DashboardLayout;

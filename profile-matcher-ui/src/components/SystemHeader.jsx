/**
 * SystemHeader - Header component with title, status indicator, and system info toggle
 */

import React from "react";

const SystemHeader = ({ apiStatus, showSystemInfo, onToggleSystemInfo }) => {
  const getStatusText = () => {
    switch (apiStatus) {
      case "healthy":
        return "Online";
      case "unhealthy":
        return "Offline";
      default:
        return "Checking...";
    }
  };

  const getStatusClass = () => {
    switch (apiStatus) {
      case "healthy":
        return "online";
      case "unhealthy":
        return "offline";
      default:
        return "offline";
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div>
            <h1 className="header-title">Profile Matching System</h1>
            <p className="header-subtitle">
              AI-powered customer profile matching across multiple data sources
            </p>
          </div>
          <div className="header-status">
            <div className="status-indicator">
              <div className={`status-dot ${getStatusClass()}`}></div>
              <span className="status-text">API {getStatusText()}</span>
            </div>
            <button onClick={onToggleSystemInfo} className="refresh-button">
              {showSystemInfo ? "Hide" : "Show"} System Info
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SystemHeader;

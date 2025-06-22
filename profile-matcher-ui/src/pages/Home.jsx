/**
 * Home Page - Main page for the Profile Matching System
 */

import React, { useState, useEffect } from "react";
import QueryForm from "../components/QueryForm";
import MatchDetails from "../components/MatchDetails";
import AlertComponent from "../components/AlertComponent";
import SystemHeader from "../components/SystemHeader";
import SystemInfoPanel from "../components/SystemInfoPanel";
import SearchResults from "../components/SearchResults";
import FeatureCard from "../components/FeatureCard";
import "./Home.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiError, setApiError] = useState(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [dataSources, setDataSources] = useState([]);
  const [schemaMappings, setSchemaMappings] = useState([]);

  useEffect(() => {
    checkApiHealth();
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const [sourcesResponse, mappingsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/data-sources`),
        fetch(`${API_BASE_URL}/schema-mappings`),
      ]);

      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        setDataSources(sourcesData.sources || []);
      }

      if (mappingsResponse.ok) {
        const mappingsData = await mappingsResponse.json();
        setSchemaMappings(mappingsData.mappings || []);
      }
    } catch (error) {
      console.error("Failed to load system info:", error);
    }
  };

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setApiStatus("healthy");
        setApiError(null);
      } else {
        setApiStatus("unhealthy");
        setApiError("API returned error status");
      }
    } catch (error) {
      setApiStatus("unhealthy");
      setApiError(error.message);
    }
  };

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/match-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      setResult(data);

      if (data.individual_matches && data.individual_matches.length === 0) {
        setError(
          "No matching profiles found. Try adjusting your search criteria."
        );
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setResult(null);
  };

  const getApiStatusProps = () => {
    if (apiStatus === "healthy") {
      return {
        type: "success",
        title: "System Online",
        message:
          "Profile matching system is ready. You can search for customer profiles across all connected data sources.",
        actions: [
          {
            label: "Refresh Status",
            onClick: checkApiHealth,
            variant: "primary",
          },
          {
            label: `${showSystemInfo ? "Hide" : "Show"} System Info`,
            onClick: () => setShowSystemInfo(!showSystemInfo),
            variant: "secondary",
          },
        ],
      };
    }

    if (apiStatus === "unhealthy") {
      return {
        type: "error",
        title: "API Connection Failed",
        message: `Unable to connect to the profile matching service. Please check that the backend server is running.${
          apiError ? ` Error: ${apiError}` : ""
        }`,
        actions: [
          {
            label: "Retry Connection",
            onClick: checkApiHealth,
            variant: "primary",
          },
          {
            label: "System Info",
            onClick: () => setShowSystemInfo(!showSystemInfo),
            variant: "secondary",
          },
        ],
      };
    }

    return {
      type: "error",
      title: "Connection Error",
      message:
        "Failed to connect to the profile matching API. Please check your connection and try again.",
      actions: [
        {
          label: loading ? "Retrying..." : "Retry",
          onClick: checkApiHealth,
          disabled: loading,
          variant: "primary",
        },
        {
          label: "System Info",
          onClick: () => setShowSystemInfo(!showSystemInfo),
          variant: "secondary",
        },
      ],
      loading,
    };
  };

  return (
    <div className="home-container">
      {/* Header */}
      <SystemHeader
        apiStatus={apiStatus}
        showSystemInfo={showSystemInfo}
        onToggleSystemInfo={() => setShowSystemInfo(!showSystemInfo)}
      />

      {/* System Information Panel */}
      {showSystemInfo && (
        <SystemInfoPanel
          dataSources={dataSources}
          schemaMappings={schemaMappings}
        />
      )}

      {/* Main Content */}
      <main className="main-content">
        {/* API Status Alert */}
        <AlertComponent {...getApiStatusProps()} />

        {/* Error Alert */}
        {error && (
          <AlertComponent
            type="error"
            title="Search Error"
            message={error}
            actions={[
              {
                label: "Try Again",
                onClick: handleRetry,
                variant: "primary",
              },
            ]}
          />
        )}

        <div className="content-grid">
          {/* Left Column - Search Form */}
          <div className="content-section">
            <QueryForm onSubmit={handleSearch} loading={loading} />

            {/* Feature Card */}
            <FeatureCard
              dataSources={dataSources}
              schemaMappings={schemaMappings}
            />
          </div>

          {/* Right Column - Results */}
          <SearchResults
            loading={loading}
            result={result}
            onSelectMatch={setSelectedMatch}
          />
        </div>
      </main>

      {/* Match Details Modal */}
      {selectedMatch && (
        <MatchDetails
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
};

export default Home;

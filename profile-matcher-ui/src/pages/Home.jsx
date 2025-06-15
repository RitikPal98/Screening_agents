/**
 * Home Page - Main page for the Profile Matching System
 */

import React, { useState, useEffect } from "react";
import QueryForm from "../components/QueryForm";
import ProfileCard from "../components/ProfileCard";
import MatchDetails from "../components/MatchDetails";
// import { matchProfile, getHealthStatus } from "../services/api";
// Fallback import for testing
import { matchProfile, getHealthStatus } from "../services/api-fallback";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState("unknown");
  const [lastQuery, setLastQuery] = useState(null);

  useEffect(() => {
    // Check API health on component mount
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      await getHealthStatus();
      setApiStatus("healthy");
    } catch (error) {
      console.error("API health check failed:", error);
      setApiStatus("unhealthy");
    }
  };

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLastQuery(query);

    try {
      console.log("Searching for profile with query:", query);
      const response = await matchProfile(query);
      console.log("Search response received:", response);

      if (response.success) {
        setResult(response);
        if (!response.profile) {
          setError("No matching profile found with the provided criteria.");
        }
      } else {
        setError(response.error || "Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      setError(
        error.message || "An error occurred while searching for the profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleSearch(lastQuery);
    }
  };

  const renderApiStatus = () => {
    if (apiStatus === "healthy") {
      return (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                API is healthy and ready to process requests
              </p>
            </div>
          </div>
        </div>
      );
    } else if (apiStatus === "unhealthy") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                API is not responding. Please ensure the backend server is
                running on port 5000.
              </p>
              <button
                onClick={checkApiHealth}
                className="mt-2 text-sm text-red-600 underline hover:text-red-500"
              >
                Retry connection
              </button>
              <button
                onClick={() => {
                  console.log("Testing direct API call...");
                  fetch("http://localhost:5000/health")
                    .then((response) => response.json())
                    .then((data) => {
                      console.log("Direct fetch success:", data);
                      alert(
                        "Direct API call successful! Check console for details."
                      );
                    })
                    .catch((error) => {
                      console.error("Direct fetch error:", error);
                      alert("Direct API call failed: " + error.message);
                    });
                }}
                className="mt-2 ml-2 text-sm text-blue-600 underline hover:text-blue-500"
              >
                Test Direct Connection
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Search Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            {lastQuery && (
              <div className="mt-3">
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 disabled:opacity-50"
                >
                  Retry Search
                </button>
                <button
                  onClick={() => {
                    console.log("Testing direct profile search...");
                    fetch("http://localhost:5000/match-profile", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        full_name: "Leonardo DiCaprio",
                        dob: "1974-11-11",
                        national_id: "BANK001",
                      }),
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        console.log("Direct profile search success:", data);
                        alert(
                          "Direct profile search successful! Check console for details."
                        );
                      })
                      .catch((error) => {
                        console.error("Direct profile search error:", error);
                        alert("Direct profile search failed: " + error.message);
                      });
                  }}
                  className="ml-2 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200"
                >
                  Test Direct Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Profile Matching System
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                AI-powered customer profile matching across multiple data
                sources
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  apiStatus === "healthy"
                    ? "bg-green-400"
                    : apiStatus === "unhealthy"
                    ? "bg-red-400"
                    : "bg-yellow-400"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                API{" "}
                {apiStatus === "healthy"
                  ? "Online"
                  : apiStatus === "unhealthy"
                  ? "Offline"
                  : "Checking..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderApiStatus()}
        {renderError()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Search Form */}
          <div className="space-y-6">
            <QueryForm onSubmit={handleSearch} loading={loading} />

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                How to Use
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Enter the customer's full name (required)</li>
                <li>
                  • Add date of birth and/or national ID for better accuracy
                </li>
                <li>• Click "Search Profile" to find matching records</li>
                <li>• Use the test cases for quick testing</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {loading && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">
                    Searching for matching profiles...
                  </span>
                </div>
              </div>
            )}

            {!loading && result && (
              <>
                <ProfileCard
                  profile={result.profile}
                  metadata={result.metadata}
                />

                {result.profile && (
                  <MatchDetails
                    metadata={result.metadata}
                    query={result.query}
                  />
                )}
              </>
            )}

            {!loading && !result && !error && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Search
                  </h3>
                  <p className="text-gray-600">
                    Enter customer details in the form to find matching profiles
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>
              Profile Matching System powered by AI agents for schema
              identification and profile matching
            </p>
            <p className="mt-1">
              Built with React.js and Flask • Agent-based architecture
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;

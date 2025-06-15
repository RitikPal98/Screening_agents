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
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
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
            </div>
            <div className="ml-4">
              <p className="text-green-800 font-medium text-lg">
                API is healthy and ready to process requests
              </p>
            </div>
          </div>
        </div>
      );
    } else if (apiStatus === "unhealthy") {
      return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-400 rounded-lg flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
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
            </div>
            <div className="ml-4">
              <p className="text-red-800 font-medium text-lg mb-3">
                API is not responding. Please ensure the backend server is
                running on port 5000.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={checkApiHealth}
                  className="text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 font-medium transition-colors"
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
                  className="text-sm bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 font-medium transition-colors"
                >
                  Test Direct Connection
                </button>
              </div>
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
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-400 rounded-lg flex items-center justify-center">
              <svg
                className="h-4 w-4 text-white"
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
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Search Error
            </h3>
            <div className="text-red-700 mb-4">
              <p className="text-base">{error}</p>
            </div>
            {lastQuery && (
              <div className="flex space-x-3">
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium transition-colors"
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
                  className="text-sm bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 font-medium transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#401664] to-[#5a1a7a] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Profile Matching System
              </h1>
              <p className="text-purple-100 text-lg">
                AI-powered customer profile matching across multiple data
                sources
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <div
                className={`w-3 h-3 rounded-full shadow-sm ${
                  apiStatus === "healthy"
                    ? "bg-green-400 animate-pulse"
                    : apiStatus === "unhealthy"
                    ? "bg-red-400"
                    : "bg-yellow-400"
                }`}
              ></div>
              <span className="text-sm text-white font-medium">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {renderApiStatus()}
        {renderError()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Search Form */}
          <div className="space-y-8">
            <QueryForm onSubmit={handleSearch} loading={loading} />

            {/* Instructions */}
            <div className="bg-gradient-to-r from-[#401664]/5 to-purple-50 border border-[#401664]/20 rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-[#401664] rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#401664]">
                  How to Use
                </h3>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">•</span>
                  Enter the customer's full name (required)
                </li>
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">•</span>
                  Add date of birth and/or national ID for better accuracy
                </li>
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">•</span>
                  Click "Search Profile" to find matching records
                </li>
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">•</span>
                  Use the test cases for quick testing
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-8">
            {loading && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#401664] border-t-transparent absolute top-0"></div>
                  </div>
                  <span className="text-gray-700 mt-4 text-lg font-medium">
                    Searching for matching profiles...
                  </span>
                  <span className="text-gray-500 mt-2">
                    Analyzing data across multiple sources
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
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#401664] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Ready to Search
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Enter customer details in the form to find matching profiles
                    across our data sources
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-12 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#401664] to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800">
                Profile Matching System
              </h4>
            </div>
            <p className="text-gray-600 mb-2">
              Powered by AI agents for intelligent schema identification and
              profile matching
            </p>
            <p className="text-sm text-gray-500">
              Built with React.js and Flask • Agent-based architecture •
              Advanced ML algorithms
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;

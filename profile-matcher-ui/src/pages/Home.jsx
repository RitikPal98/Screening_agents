/**
 * Home Page - Main page for the Profile Matching System
 */

import React, { useState, useEffect } from "react";
import QueryForm from "../components/QueryForm";
import ProfileCard from "../components/ProfileCard";
import MatchDetails from "../components/MatchDetails";
import {
  matchProfile,
  getHealthStatus,
  getDataSources,
  getSchemaMappings,
} from "../services/api";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState("unknown");
  const [lastQuery, setLastQuery] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [schemaMappings, setSchemaMappings] = useState([]);
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  useEffect(() => {
    // Check API health and load system info on component mount
    checkApiHealth();
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const [sourcesResponse, mappingsResponse] = await Promise.all([
        getDataSources(),
        getSchemaMappings(),
      ]);

      if (sourcesResponse.success) {
        setDataSources(sourcesResponse.sources);
      }

      if (mappingsResponse.success) {
        setSchemaMappings(mappingsResponse.mappings);
      }
    } catch (error) {
      console.error("Failed to load system info:", error);
    }
  };

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
        if (
          !response.profile &&
          (!response.individual_matches ||
            response.individual_matches.length === 0)
        ) {
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
            <div className="flex items-center space-x-4">
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
              <button
                onClick={() => setShowSystemInfo(!showSystemInfo)}
                className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white font-medium hover:bg-white/20 transition-colors"
              >
                {showSystemInfo ? "Hide" : "Show"} System Info
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* System Information Panel */}
      {showSystemInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Data Sources Info */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
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
                        d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Data Sources
                  </h3>
                  <span className="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {dataSources.length} sources
                  </span>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {dataSources.map((source, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {source.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {source.record_count} records
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {source.columns.length} fields
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schema Mappings Info */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Schema Mappings
                  </h3>
                  <span className="ml-auto bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    AI-Enhanced
                  </span>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {schemaMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {mapping.source}
                        </div>
                        <div className="text-sm text-gray-600">
                          {mapping.field_count} mapped fields
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-purple-600">
                          {Math.round(mapping.confidence_avg)}% confidence
                        </div>
                        <div className="text-xs text-gray-500">
                          {mapping.unified_fields.length} unified fields
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  Enhanced AI System
                </h3>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">🚀</span>
                  Dynamic schema evolution with{" "}
                  {schemaMappings.reduce(
                    (total, mapping) => total + mapping.unified_fields.length,
                    0
                  )}{" "}
                  unified fields
                </li>
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">🧠</span>
                  AI-powered field mapping with Gemini integration
                </li>
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">📊</span>
                  Processes both structured and unstructured data
                </li>
                <li className="flex items-start">
                  <span className="text-[#401664] mr-2">⚡</span>
                  Real-time profile matching across{" "}
                  {dataSources.reduce(
                    (total, source) => total + source.record_count,
                    0
                  )}{" "}
                  records
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
                {/* Main Merged Profile */}
                {result.profile && (
                  <ProfileCard
                    profile={result.profile}
                    metadata={result.metadata}
                    matchSummary={result.match_summary}
                  />
                )}

                {/* Individual Matches */}
                {result.individual_matches &&
                  result.individual_matches.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
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
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Individual Matches
                        </h3>
                        <span className="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {result.individual_matches.length} matches found
                        </span>
                      </div>

                      {/* Match Summary */}
                      {result.match_summary && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {result.match_summary.total_matches}
                              </div>
                              <div className="text-sm text-gray-600">
                                Total Matches
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-purple-600">
                                {result.match_summary.sources_matched}
                              </div>
                              <div className="text-sm text-gray-600">
                                Sources
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {Math.round(result.match_summary.highest_score)}
                                %
                              </div>
                              <div className="text-sm text-gray-600">
                                Best Score
                              </div>
                            </div>
                            <div>
                              <div
                                className={`text-2xl font-bold ${
                                  result.match_summary.has_strong_matches
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {result.match_summary.has_strong_matches
                                  ? "✓"
                                  : "~"}
                              </div>
                              <div className="text-sm text-gray-600">
                                Strong Match
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {result.individual_matches.map((match, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-3">
                                  {match.source_name
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                                {match.match_info?.is_strong_match && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg
                                      className="w-3 h-3 mr-1"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Strong Match
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      match.match_info?.match_score >= 90
                                        ? "bg-green-500"
                                        : match.match_info?.match_score >= 70
                                        ? "bg-yellow-500"
                                        : match.match_info?.match_score >= 50
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        match.match_info?.match_score || 0,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-600">
                                  {Math.round(
                                    match.match_info?.match_score || 0
                                  )}
                                  %
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                              {match.full_name && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Name:
                                  </span>
                                  <span className="ml-1 text-gray-900">
                                    {match.full_name}
                                  </span>
                                </div>
                              )}
                              {match.dob && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    DOB:
                                  </span>
                                  <span className="ml-1 text-gray-900">
                                    {match.dob}
                                  </span>
                                </div>
                              )}
                              {match.national_id && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    ID:
                                  </span>
                                  <span className="ml-1 text-gray-900">
                                    {match.national_id}
                                  </span>
                                </div>
                              )}
                              {match.email && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Email:
                                  </span>
                                  <span className="ml-1 text-gray-900">
                                    {match.email}
                                  </span>
                                </div>
                              )}
                              {match.phone && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Phone:
                                  </span>
                                  <span className="ml-1 text-gray-900">
                                    {match.phone}
                                  </span>
                                </div>
                              )}
                              {match.address && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Address:
                                  </span>
                                  <span className="ml-1 text-gray-900">
                                    {match.address}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Match Details */}
                {(result.profile ||
                  (result.individual_matches &&
                    result.individual_matches.length > 0)) && (
                  <MatchDetails
                    metadata={result.metadata}
                    query={result.query}
                    matchSummary={result.match_summary}
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
              Enhanced AI-powered system with dynamic schema evolution and
              intelligent data processing
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {dataSources.length} Data Sources
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                AI Schema Mapping
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Structured & Unstructured Data
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                Real-time Gemini Integration
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;

/**
 * MatchDetails Component - Display detailed matching information and metadata
 */

import React, { useState } from "react";

const MatchDetails = ({ metadata, query }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata) {
    return null;
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const getMatchQualityBadge = (isStrong, score) => {
    if (isStrong) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Strong Match
        </span>
      );
    } else if (score >= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Good Match
        </span>
      );
    } else if (score >= 50) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Fair Match
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Weak Match
        </span>
      );
    }
  };

  const renderQueryInfo = () => (
    <div className="bg-gradient-to-r from-[#401664]/5 to-purple-50 border border-[#401664]/20 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <div className="w-6 h-6 bg-[#401664] rounded-lg flex items-center justify-center mr-3">
          <svg
            className="w-3 h-3 text-white"
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
        <h4 className="text-lg font-semibold text-[#401664]">Search Query</h4>
      </div>
      <dl className="grid grid-cols-1 gap-3">
        {Object.entries(query || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <dt className="text-sm text-gray-700 capitalize font-medium">
              {key.replace(/_/g, " ")}:
            </dt>
            <dd className="text-sm text-[#401664] font-semibold bg-white px-3 py-1 rounded-lg">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const renderMatchQuality = () => {
    const matchQuality = metadata.match_quality || {};
    const overallScore = matchQuality.overall_score || 0;
    const isStrongMatch = matchQuality.is_strong_match || false;
    const fieldScores = matchQuality.field_scores || {};

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Match Quality</h4>
          {getMatchQualityBadge(isStrongMatch, overallScore)}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Score</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    overallScore >= 90
                      ? "bg-green-500"
                      : overallScore >= 70
                      ? "bg-yellow-500"
                      : overallScore >= 50
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(overallScore, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(overallScore)}%
              </span>
            </div>
          </div>

          {Object.keys(fieldScores).length > 0 && (
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-sm text-gray-600">Field Scores</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {Object.entries(fieldScores).map(([field, score]) => (
                    <div
                      key={field}
                      className="flex items-center justify-between pl-4"
                    >
                      <span className="text-xs text-gray-500 capitalize">
                        {field.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              score >= 90
                                ? "bg-green-500"
                                : score >= 70
                                ? "bg-yellow-500"
                                : score >= 50
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {Math.round(score)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSearchMetadata = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Search Information
      </h4>
      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Search Time:</dt>
          <dd className="text-gray-900">
            {formatTimestamp(metadata.search_timestamp)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Sources Searched:</dt>
          <dd className="text-gray-900">{metadata.sources_searched || 0}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Total Matches:</dt>
          <dd className="text-gray-900">{metadata.match_count || 0}</dd>
        </div>
        {metadata.sources && metadata.sources.length > 0 && (
          <div>
            <dt className="text-gray-600 mb-1">Matching Sources:</dt>
            <dd className="text-gray-900">
              <div className="flex flex-wrap gap-1">
                {metadata.sources.map((source, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {source
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-[#401664] to-purple-600 rounded-xl flex items-center justify-center mr-4">
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
          <h3 className="text-2xl font-bold text-gray-900">Match Details</h3>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {metadata.sources?.length || 0} source(s) matched
        </span>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderQueryInfo()}
          {renderMatchQuality()}
        </div>

        {renderSearchMetadata()}

        {/* Additional Debug Information (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <details className="bg-gray-50 rounded-lg p-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Debug Information (Development Only)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default MatchDetails;

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
    <div className="bg-blue-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Search Query</h4>
      <dl className="grid grid-cols-1 gap-2">
        {Object.entries(query || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <dt className="text-sm text-blue-700 capitalize">
              {key.replace(/_/g, " ")}:
            </dt>
            <dd className="text-sm text-blue-900 font-medium">{value}</dd>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Match Details</h3>
        <span className="text-sm text-gray-500">
          {metadata.sources?.length || 0} source(s) matched
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
  );
};

export default MatchDetails;

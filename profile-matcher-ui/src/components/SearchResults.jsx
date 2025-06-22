/**
 * SearchResults - Component for displaying search results and loading states
 */

import React from "react";
import ProfileCard from "./ProfileCard";

const SearchResults = ({ loading, result, onSelectMatch }) => {
  if (loading) {
    return (
      <div className="results-section">
        <div className="loading-container">
          <div className="loading-spinner-container">
            <div className="loading-spinner-bg"></div>
            <div className="loading-spinner-fg"></div>
          </div>
          <span className="loading-text">
            Searching for matching profiles...
          </span>
          <span className="loading-subtext">
            Analyzing data across multiple sources
          </span>
        </div>
      </div>
    );
  }

  // Show placeholder when no search has been performed yet
  if (!result) {
    return (
      <div className="results-section">
        <div className="welcome-state">
          <div className="welcome-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="welcome-title">Ready to Search</h3>
          <p className="welcome-text">
            Enter customer information in the search form to find matching
            profiles across all connected data sources.
          </p>
          <div className="welcome-features">
            <div className="welcome-feature">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>AI-powered matching</span>
            </div>
            <div className="welcome-feature">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Multiple data sources</span>
            </div>
            <div className="welcome-feature">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Fuzzy name matching</span>
            </div>
            <div className="welcome-feature">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Confidence scoring</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-section">
      {/* Main Merged Profile */}
      {result.profile && (
        <ProfileCard
          profile={result.profile}
          metadata={result.metadata}
          matchSummary={result.match_summary}
        />
      )}

      {/* Individual Matches */}
      {result.individual_matches && result.individual_matches.length > 0 && (
        <div className="results-container">
          <div className="results-header">
            <div className="results-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="results-title">Individual Matches</h3>
            <span className="results-badge">
              {result.individual_matches.length} matches found
            </span>
          </div>

          {/* Match Summary */}
          {result.match_summary && (
            <div className="results-summary">
              <div className="summary-stats">
                <div className="summary-stat">
                  <div className="summary-stat-value">
                    {result.match_summary.total_matches}
                  </div>
                  <div className="summary-stat-label">Total Matches</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-value">
                    {result.match_summary.sources_matched}
                  </div>
                  <div className="summary-stat-label">Sources</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-value">
                    {Math.round(result.match_summary.highest_score)}%
                  </div>
                  <div className="summary-stat-label">Best Score</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-value">
                    {result.match_summary.has_strong_matches ? "✓" : "~"}
                  </div>
                  <div className="summary-stat-label">Strong Match</div>
                </div>
              </div>
            </div>
          )}

          <div className="matches-list">
            {result.individual_matches.map((match, index) => (
              <div key={index} className="match-item">
                <div className="match-header">
                  <div className="match-badges">
                    <span className="source-badge">
                      {match.source_name
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    {match.match_info?.is_strong_match && (
                      <span className="strong-match-badge">
                        <svg
                          className="badge-icon"
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
                  <div className="match-score-display">
                    <div className="score-bar">
                      <div
                        className={`score-fill ${
                          match.match_info?.match_score >= 90
                            ? "excellent"
                            : match.match_info?.match_score >= 70
                            ? "good"
                            : match.match_info?.match_score >= 50
                            ? "fair"
                            : "poor"
                        }`}
                        style={{
                          width: `${Math.min(
                            match.match_info?.match_score || 0,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="score-text">
                      {Math.round(match.match_info?.match_score || 0)}%
                    </span>
                  </div>
                </div>

                <div className="match-fields">
                  {match.full_name && (
                    <div className="match-field">
                      <span className="field-label">Name:</span>
                      <span className="field-value">{match.full_name}</span>
                    </div>
                  )}
                  {match.dob && (
                    <div className="match-field">
                      <span className="field-label">DOB:</span>
                      <span className="field-value">{match.dob}</span>
                    </div>
                  )}
                  {match.email && (
                    <div className="match-field">
                      <span className="field-label">Email:</span>
                      <span className="field-value email">{match.email}</span>
                    </div>
                  )}
                  {match.customer_id && (
                    <div className="match-field">
                      <span className="field-label">ID:</span>
                      <span className="field-value">{match.customer_id}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectMatch(match)}
                  className="view-details-btn"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading &&
        result &&
        (!result.individual_matches ||
          result.individual_matches.length === 0) && (
          <div className="no-results">
            <div className="no-results-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.513.751-6.077 2.029C5.453 17.555 5.357 18 5.582 18H18.42c.225 0 .129-.445-.342-.971A7.962 7.962 0 0012 15z"
                />
              </svg>
            </div>
            <h3 className="no-results-title">No Profiles Found</h3>
            <p className="no-results-text">
              No matching customer profiles were found. Try adjusting your
              search criteria or check if the data sources contain relevant
              information.
            </p>
            <div className="no-results-suggestions">
              <h4>Search Tips:</h4>
              <ul>
                <li>Try using partial names or nicknames</li>
                <li>Check date format (YYYY-MM-DD)</li>
                <li>Verify email format</li>
                <li>Use customer IDs when available</li>
              </ul>
            </div>
          </div>
        )}
    </div>
  );
};

export default SearchResults;

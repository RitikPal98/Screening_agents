/**
 * MatchDetails Component - Display detailed matching information and metadata
 */

import React, { useState, useEffect } from "react";
import "./MatchDetails.css";

const MatchDetails = ({ match, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!match) {
    return null;
  }

  // Extract data from the match object
  const metadata = match.match_info || {};
  const query = null; // Query info not available in individual match
  const matchSummary = null; // Match summary not available for individual match

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const getMatchQualityBadge = (isStrong, score) => {
    if (isStrong) {
      return <span className="match-score excellent">Strong Match</span>;
    } else if (score >= 70) {
      return <span className="match-score good">Good Match</span>;
    } else if (score >= 50) {
      return <span className="match-score fair">Fair Match</span>;
    } else {
      return <span className="match-score poor">Weak Match</span>;
    }
  };

  const renderMatchInfo = () => (
    <div className="match-summary">
      <div className="summary-header">
        <h4 className="section-title">
          <svg
            className="section-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Profile Information
        </h4>
      </div>

      <div className="match-fields">
        {match.full_name && (
          <div className="match-field">
            <span className="field-label">Full Name:</span>
            <span className="field-value">{match.full_name}</span>
          </div>
        )}
        {match.dob && (
          <div className="match-field">
            <span className="field-label">Date of Birth:</span>
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
            <span className="field-label">Customer ID:</span>
            <span className="field-value">{match.customer_id}</span>
          </div>
        )}
        {match.source_name && (
          <div className="match-field">
            <span className="field-label">Data Source:</span>
            <span className="field-value">
              {match.source_name
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderMatchQuality = () => {
    const matchQuality = metadata;
    const overallScore = matchQuality.match_score || 0;
    const isStrongMatch = matchQuality.is_strong_match || false;
    const fieldScores = matchQuality.field_scores || {};

    return (
      <div className="field-scores-section">
        <div className="match-header">
          <h4 className="field-scores-title">Match Quality</h4>
          {getMatchQualityBadge(isStrongMatch, overallScore)}
        </div>

        <div className="field-scores-grid">
          <div className="field-score-item">
            <span className="field-score-name">Overall Score</span>
            <div className="field-score-value">
              <div className="field-score-bar">
                <div
                  className={`field-score-fill ${
                    overallScore >= 90
                      ? "excellent"
                      : overallScore >= 70
                      ? "good"
                      : overallScore >= 50
                      ? "fair"
                      : "poor"
                  }`}
                  style={{ width: `${Math.min(overallScore, 100)}%` }}
                ></div>
              </div>
              <span className="field-score-number">
                {Math.round(overallScore)}%
              </span>
            </div>
          </div>

          {Object.keys(fieldScores).length > 0 && (
            <div className="field-scores-expandable">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="expand-button"
              >
                <span className="field-score-name">Field Scores</span>
                <svg
                  className={`expand-icon ${isExpanded ? "expanded" : ""}`}
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
                <div className="field-scores-details">
                  {Object.entries(fieldScores).map(([field, score]) => (
                    <div key={field} className="field-score-item">
                      <span className="field-score-name">
                        {field.replace(/_/g, " ")}
                      </span>
                      <div className="field-score-value">
                        <div className="field-score-bar">
                          <div
                            className={`field-score-fill ${
                              score >= 90
                                ? "excellent"
                                : score >= 70
                                ? "good"
                                : score >= 50
                                ? "fair"
                                : "poor"
                            }`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          ></div>
                        </div>
                        <span className="field-score-number">
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

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Match Details</h3>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="Close"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="match-details-container">
            {renderMatchInfo()}
            {renderMatchQuality()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;

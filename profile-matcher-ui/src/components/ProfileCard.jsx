/**
 * ProfileCard Component - Display matched customer profile
 */

import React from "react";
import "./ProfileCard.css";

const ProfileCard = ({ profile, metadata }) => {
  if (!profile) {
    return (
      <div className="profile-card">
        <div className="profile-details">
          <p className="field-value empty">No profile data available</p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (score) => {
    if (score >= 90) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "fair";
    return "poor";
  };

  const getConfidenceText = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }
    return String(value);
  };

  const renderField = (label, value, fieldKey) => {
    const formattedValue = formatFieldValue(value);
    const isEmpty = formattedValue === "Not available";

    return (
      <div key={fieldKey} className="profile-field-item">
        <dt className="field-label">{label}</dt>
        <dd
          className={`field-value ${isEmpty ? "empty" : ""} ${
            fieldKey === "email" ? "email" : ""
          } ${fieldKey === "phone" ? "phone" : ""} ${
            fieldKey === "dob" ? "date" : ""
          }`}
        >
          {formattedValue}
        </dd>
      </div>
    );
  };

  const overallScore = metadata?.match_quality?.overall_score || 0;
  const isStrongMatch = metadata?.match_quality?.is_strong_match || false;

  return (
    <div className="profile-card">
      {/* Header */}
      <div className="profile-card-header">
        <div className="profile-header-content">
          <div className="profile-info">
            <div className="profile-icon-section">
              <div className="profile-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="profile-title">Customer Profile</h2>
            </div>
            <p className="profile-subtitle">
              Matched from {profile.sources?.length || 0} source(s)
            </p>
          </div>
          <div className="profile-score-section">
            <div className="score-display">
              <div className="score-bar-large">
                <div
                  className={`score-fill-large ${getConfidenceColor(
                    overallScore
                  )}`}
                  style={{ width: `${Math.min(overallScore, 100)}%` }}
                ></div>
              </div>
              <span className="score-percentage">
                {Math.round(overallScore)}%
              </span>
            </div>
            <p className="score-confidence-text">
              {getConfidenceText(overallScore)} Confidence
            </p>
          </div>
        </div>
      </div>

      {/* Match Quality Badge */}
      {isStrongMatch && (
        <div className="strong-match-banner">
          <div className="strong-match-content">
            <div className="strong-match-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="strong-match-text">
              <strong>Strong Match:</strong> High confidence match based on
              multiple attributes
            </div>
          </div>
        </div>
      )}

      {/* Profile Details */}
      <div className="profile-details">
        <dl className="profile-fields-list">
          {renderField("Full Name", profile.full_name, "full_name")}
          {renderField("Date of Birth", profile.dob, "dob")}
          {renderField("National ID", profile.national_id, "national_id")}
          {renderField("Email", profile.email, "email")}
          {renderField("Phone", profile.phone, "phone")}
          {renderField("Address", profile.address, "address")}

          {/* Additional fields */}
          {Object.entries(profile).map(([key, value]) => {
            if (
              [
                "full_name",
                "dob",
                "national_id",
                "email",
                "phone",
                "address",
                "sources",
                "match_count",
                "match_quality",
                "merged_at",
              ].includes(key)
            ) {
              return null;
            }
            return renderField(
              key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              value,
              key
            );
          })}
        </dl>
      </div>

      {/* Source Information */}
      {profile.sources && profile.sources.length > 0 && (
        <div className="profile-sources-section">
          <div className="sources-header">
            <div className="sources-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
            <h3 className="sources-title">Data Sources</h3>
          </div>
          <div className="sources-tags">
            {profile.sources.map((source, index) => (
              <span key={index} className="source-tag">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {source
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
          </div>
          <div className="sources-metadata">
            <p>Total matches found: {profile.match_count || 1}</p>
            {profile.merged_at && (
              <p>
                Profile merged at:{" "}
                {new Date(profile.merged_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Field Scores Details */}
      {metadata?.match_quality?.field_scores && (
        <div className="field-scores-section">
          <h3 className="field-scores-title">Match Scores by Field</h3>
          <div className="field-scores-grid">
            {Object.entries(metadata.match_quality.field_scores).map(
              ([field, score]) => (
                <div key={field} className="field-score-item">
                  <span className="field-score-name">
                    {field.replace(/_/g, " ")}
                  </span>
                  <div className="field-score-value">
                    <div className="field-score-bar">
                      <div
                        className={`field-score-fill ${getConfidenceColor(
                          score
                        )}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      ></div>
                    </div>
                    <span className="field-score-number">
                      {Math.round(score)}%
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;

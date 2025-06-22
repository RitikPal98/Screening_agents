/**
 * FeatureCard - Component for displaying system features and capabilities
 */

import React from "react";

const FeatureCard = ({ dataSources, schemaMappings }) => {
  const totalUnifiedFields = schemaMappings.reduce(
    (total, mapping) => total + mapping.unified_fields.length,
    0
  );

  const totalRecords = dataSources.reduce(
    (total, source) => total + source.record_count,
    0
  );

  return (
    <div className="feature-card">
      <div className="feature-card-header">
        <div className="feature-card-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="feature-card-title">Enhanced AI System</h3>
      </div>
      <ul className="feature-list">
        <li>
          <span className="feature-icon">🚀</span>
          Dynamic schema evolution with {totalUnifiedFields} unified fields
        </li>
        <li>
          <span className="feature-icon">🧠</span>
          AI-powered field mapping with Gemini integration
        </li>
        <li>
          <span className="feature-icon">📊</span>
          Processes both structured and unstructured data
        </li>
        <li>
          <span className="feature-icon">⚡</span>
          Real-time profile matching across {totalRecords.toLocaleString()}{" "}
          records
        </li>
      </ul>
    </div>
  );
};

export default FeatureCard;

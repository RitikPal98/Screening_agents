/**
 * SystemInfoPanel - System information panel showing data sources and schema mappings
 */

import React from "react";

const SystemInfoPanel = ({ dataSources, schemaMappings }) => {
  return (
    <div className="info-section">
      <div className="info-container">
        <div className="info-grid">
          {/* Data Sources Info */}
          <div className="info-card">
            <div className="info-card-header">
              <div className="info-card-icon blue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z"
                  />
                </svg>
              </div>
              <h3 className="info-card-title">Data Sources</h3>
              <span className="info-card-badge blue">
                {dataSources.length} sources
              </span>
            </div>
            <div className="info-card-content">
              <div className="info-list">
                {dataSources.map((source, index) => (
                  <div key={index} className="info-item">
                    <div className="info-item-main">
                      <div className="info-item-name">{source.name}</div>
                      <div className="info-item-details">
                        {source.record_count} records
                      </div>
                    </div>
                    <div className="info-item-meta">
                      {source.columns.length} fields
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schema Mappings Info */}
          <div className="info-card">
            <div className="info-card-header">
              <div className="info-card-icon purple">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="info-card-title">Schema Mappings</h3>
              <span className="info-card-badge purple">AI-Enhanced</span>
            </div>
            <div className="info-card-content">
              <div className="info-list">
                {schemaMappings.map((mapping, index) => (
                  <div key={index} className="info-item">
                    <div className="info-item-main">
                      <div className="info-item-name">{mapping.source}</div>
                      <div className="info-item-details">
                        {mapping.field_count} mapped fields
                      </div>
                    </div>
                    <div className="info-item-score">
                      <div className="info-item-score-value">
                        {Math.round(mapping.confidence_avg)}% confidence
                      </div>
                      <div className="info-item-score-label">
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
    </div>
  );
};

export default SystemInfoPanel;

/**
 * AlertComponent - Reusable alert component for different states and messages
 */

import React from "react";

const AlertComponent = ({
  type = "info",
  title,
  message,
  actions = [],
  loading = false,
}) => {
  const getIconSvg = () => {
    switch (type) {
      case "success":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "warning":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      default:
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        <div className="alert-icon-container">
          <div className={`alert-icon ${type}`}>{getIconSvg()}</div>
        </div>
        <div className="alert-body">
          <h3 className={`alert-title ${type}`}>{title}</h3>
          <p className={`alert-message ${type}`}>{message}</p>
        </div>
        {actions.length > 0 && (
          <div className="alert-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={loading || action.disabled}
                className={`alert-button ${
                  action.variant || "primary"
                } ${type}`}
              >
                {loading && action.loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    {action.loadingText || "Loading..."}
                  </>
                ) : (
                  action.label
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertComponent;

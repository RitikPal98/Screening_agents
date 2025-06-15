/**
 * ProfileCard Component - Display matched customer profile
 */

import React from "react";

const ProfileCard = ({ profile, metadata }) => {
  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Profile Found
          </h3>
          <p className="text-gray-600">
            No matching customer profile was found with the provided criteria.
          </p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (score) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getConfidenceText = (score) => {
    if (score >= 90) return "High";
    if (score >= 70) return "Medium";
    if (score >= 50) return "Low";
    return "Very Low";
  };

  const formatFieldValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return value?.toString() || "N/A";
  };

  const renderField = (label, value, fieldKey) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    const fieldScore = metadata?.match_quality?.field_scores?.[fieldKey];

    return (
      <div
        key={fieldKey}
        className="border-b border-gray-200 py-3 last:border-b-0"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <dt className="text-sm font-medium text-gray-600">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 break-words">
              {formatFieldValue(value)}
            </dd>
          </div>
          {fieldScore !== undefined && (
            <div className="ml-4 flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getConfidenceColor(
                      fieldScore
                    )}`}
                    style={{ width: `${Math.min(fieldScore, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(fieldScore)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const overallScore = metadata?.match_quality?.overall_score || 0;
  const isStrongMatch = metadata?.match_quality?.is_strong_match || false;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Customer Profile</h2>
            <p className="text-blue-100 text-sm">
              Matched from {profile.sources?.length || 0} source(s)
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-blue-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getConfidenceColor(
                    overallScore
                  )}`}
                  style={{ width: `${Math.min(overallScore, 100)}%` }}
                ></div>
              </div>
              <span className="text-white text-sm font-medium">
                {Math.round(overallScore)}%
              </span>
            </div>
            <p className="text-blue-100 text-xs mt-1">
              {getConfidenceText(overallScore)} Confidence
            </p>
          </div>
        </div>
      </div>

      {/* Match Quality Badge */}
      {isStrongMatch && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
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
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Strong Match:</strong> High confidence match based on
                multiple attributes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details */}
      <div className="p-6">
        <dl className="divide-y divide-gray-200">
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
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Data Sources
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.sources.map((source, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {source
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
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
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Match Scores by Field
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(metadata.match_quality.field_scores).map(
              ([field, score]) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {field.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getConfidenceColor(
                          score
                        )}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
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

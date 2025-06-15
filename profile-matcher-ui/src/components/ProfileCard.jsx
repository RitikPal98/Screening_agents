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
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#401664] to-purple-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <h2 className="text-2xl font-bold text-white">
                Customer Profile
              </h2>
            </div>
            <p className="text-purple-100 text-lg">
              Matched from {profile.sources?.length || 0} source(s)
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-24 bg-white/20 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${getConfidenceColor(
                    overallScore
                  )}`}
                  style={{ width: `${Math.min(overallScore, 100)}%` }}
                ></div>
              </div>
              <span className="text-white text-lg font-bold">
                {Math.round(overallScore)}%
              </span>
            </div>
            <p className="text-purple-100 text-sm font-medium">
              {getConfidenceText(overallScore)} Confidence
            </p>
          </div>
        </div>
      </div>

      {/* Match Quality Badge */}
      {isStrongMatch && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-6">
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
              <p className="text-green-800 font-medium">
                <strong>Strong Match:</strong> High confidence match based on
                multiple attributes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details */}
      <div className="p-8">
        <dl className="divide-y divide-gray-100">
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
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200">
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
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Data Sources
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile.sources.map((source, index) => (
              <span
                key={index}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[#401664] to-purple-600 text-white shadow-sm"
              >
                <svg
                  className="w-3 h-3 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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

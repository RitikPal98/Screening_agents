/**
 * QueryForm Component - Input form for customer search criteria
 */

import React, { useState, useEffect } from "react";
import { getTestData } from "../services/api";

const QueryForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    national_id: "",
  });
  const [testCases, setTestCases] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load test cases for quick testing
    const loadTestCases = async () => {
      try {
        const response = await getTestData();
        if (response.success) {
          setTestCases(response.test_cases);
        }
      } catch (error) {
        console.error("Failed to load test cases:", error);
      }
    };

    loadTestCases();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (formData.dob && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dob)) {
      newErrors.dob = "Date must be in YYYY-MM-DD format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Remove empty fields before submitting
    const cleanedData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value.trim() !== "")
    );

    onSubmit(cleanedData);
  };

  const handleTestCaseClick = (testCase) => {
    setFormData(testCase);
    setErrors({});
  };

  const handleClear = () => {
    setFormData({
      full_name: "",
      dob: "",
      national_id: "",
    });
    setErrors({});
  };

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-8">
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-[#401664] to-purple-600 rounded-xl flex items-center justify-center mr-4">
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
        <h2 className="text-2xl font-bold text-gray-900">
          Customer Profile Search
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Field */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#401664] focus:border-[#401664] transition-all duration-200 ${
              errors.full_name
                ? "border-red-500"
                : "border-gray-300 hover:border-gray-400"
            }`}
            placeholder="Enter customer's full name"
            disabled={loading}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>

        {/* Date of Birth Field */}
        <div>
          <label
            htmlFor="dob"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Date of Birth
          </label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#401664] focus:border-[#401664] transition-all duration-200 ${
              errors.dob
                ? "border-red-500"
                : "border-gray-300 hover:border-gray-400"
            }`}
            disabled={loading}
          />
          {errors.dob && (
            <p className="mt-1 text-sm text-red-600">{errors.dob}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional - helps improve matching accuracy
          </p>
        </div>

        {/* National ID Field */}
        <div>
          <label
            htmlFor="national_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            National ID
          </label>
          <input
            type="text"
            id="national_id"
            name="national_id"
            value={formData.national_id}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#401664] focus:border-[#401664] hover:border-gray-400 transition-all duration-200"
            placeholder="Enter national ID or passport number"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional - any government-issued ID
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-4 px-6 rounded-xl text-white font-semibold text-lg shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#401664] focus:ring-offset-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#401664] to-purple-600 hover:from-[#4a1a75] hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Searching...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
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
                Search Profile
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-[#401664] focus:outline-none focus:ring-2 focus:ring-[#401664] focus:ring-offset-2 disabled:opacity-50 font-medium transition-all duration-200"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Test Cases */}
      {testCases.length > 0 && (
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex items-center mb-6">
            <div className="w-6 h-6 bg-gradient-to-br from-[#401664] to-purple-600 rounded-lg flex items-center justify-center mr-3">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Test Cases
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => handleTestCaseClick(testCase)}
                disabled={loading}
                className="p-4 text-left border-2 border-gray-200 rounded-xl hover:border-[#401664] hover:bg-gradient-to-r hover:from-[#401664]/5 hover:to-purple-50 focus:outline-none focus:ring-2 focus:ring-[#401664] focus:border-[#401664] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                <div className="font-semibold text-gray-900 mb-2">
                  {testCase.full_name}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  DOB: {testCase.dob}
                </div>
                <div className="text-sm text-gray-600">
                  ID: {testCase.national_id}
                </div>
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500 flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-[#401664]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122"
              />
            </svg>
            Click any test case to populate the form
          </p>
        </div>
      )}
    </div>
  );
};

export default QueryForm;

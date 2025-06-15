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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Customer Profile Search
      </h2>

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
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.full_name ? "border-red-500" : "border-gray-300"
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
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.dob ? "border-red-500" : "border-gray-300"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              "Search Profile"
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Test Cases */}
      {testCases.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Test Cases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => handleTestCaseClick(testCase)}
                disabled={loading}
                className="p-3 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-gray-900">
                  {testCase.full_name}
                </div>
                <div className="text-sm text-gray-600">DOB: {testCase.dob}</div>
                <div className="text-sm text-gray-600">
                  ID: {testCase.national_id}
                </div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Click any test case to populate the form
          </p>
        </div>
      )}
    </div>
  );
};

export default QueryForm;

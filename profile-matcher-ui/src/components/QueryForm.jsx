/**
 * QueryForm Component - Input form for customer search criteria
 */

import React, { useState, useEffect } from "react";
import { getTestData } from "../services/api";
import "./QueryForm.css";

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
    <div className="query-form-container">
      <div className="query-form-header">
        <div className="query-form-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className="query-form-title">Customer Profile Search</h2>
      </div>

      <form onSubmit={handleSubmit} className="query-form">
        {/* Full Name Field */}
        <div className="form-field">
          <label htmlFor="full_name" className="form-label">
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className={`form-input ${errors.full_name ? "error" : ""}`}
            placeholder="Enter customer's full name"
            disabled={loading}
          />
          {errors.full_name && <p className="form-error">{errors.full_name}</p>}
        </div>

        {/* Date of Birth Field */}
        <div className="form-field">
          <label htmlFor="dob" className="form-label">
            Date of Birth
          </label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleInputChange}
            className={`form-input ${errors.dob ? "error" : ""}`}
            disabled={loading}
          />
          {errors.dob && <p className="form-error">{errors.dob}</p>}
          <p className="form-help-text">
            Optional - helps improve matching accuracy
          </p>
        </div>

        {/* National ID Field */}
        <div className="form-field">
          <label htmlFor="national_id" className="form-label">
            National ID
          </label>
          <input
            type="text"
            id="national_id"
            name="national_id"
            value={formData.national_id}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter national ID or passport number"
            disabled={loading}
          />
          <p className="form-help-text">Optional - any government-issued ID</p>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Searching...
              </>
            ) : (
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search Profile
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="btn btn-secondary"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Test Cases */}
      {testCases.length > 0 && (
        <div className="test-cases-section">
          <h3 className="test-cases-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Quick Test Cases
          </h3>
          <div className="test-cases-grid">
            {testCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => handleTestCaseClick(testCase)}
                disabled={loading}
                className="test-case-button"
              >
                <div className="test-case-name">{testCase.full_name}</div>
                <div className="test-case-details">DOB: {testCase.dob}</div>
                <div className="test-case-details">
                  ID: {testCase.national_id}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryForm;

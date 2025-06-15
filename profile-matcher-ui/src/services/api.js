/**
 * API service for Profile Matching System
 */

import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

console.log("API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

console.log("Axios instance created with config:", {
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method.toUpperCase()} request to ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Response error:", error);
    if (error.response) {
      // Server responded with error status
      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received:", error.request);
    } else {
      // Something else happened
      console.error("Error message:", error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Match customer profile
 * @param {Object} query - Search query with customer attributes
 * @returns {Promise} API response
 */
export const matchProfile = async (query) => {
  try {
    console.log("Sending profile match request:", query);
    const response = await api.post("/match-profile", query);
    console.log("Profile match response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Profile match error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      request: error.request,
    });

    // More specific error messages
    if (error.response) {
      // Server responded with error status
      const errorMessage =
        error.response.data?.error || `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error(
        "Cannot connect to server. Please ensure the backend is running on port 5000."
      );
    } else {
      // Something else happened
      throw new Error(error.message || "Failed to match profile");
    }
  }
};

/**
 * Get health status of the API
 * @returns {Promise} API response
 */
export const getHealthStatus = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to get health status"
    );
  }
};

/**
 * Get available data sources
 * @returns {Promise} API response
 */
export const getDataSources = async () => {
  try {
    const response = await api.get("/data-sources");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to get data sources"
    );
  }
};

/**
 * Get schema mappings
 * @returns {Promise} API response
 */
export const getSchemaMappings = async () => {
  try {
    const response = await api.get("/schema-mappings");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to get schema mappings"
    );
  }
};

/**
 * Get test data for UI testing
 * @returns {Promise} API response
 */
export const getTestData = async () => {
  try {
    const response = await api.get("/test-data");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to get test data"
    );
  }
};

export default api;

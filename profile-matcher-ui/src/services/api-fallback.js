/**
 * Fallback API service using fetch instead of axios
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

console.log("Fallback API Base URL:", API_BASE_URL);

/**
 * Match customer profile using fetch
 * @param {Object} query - Search query with customer attributes
 * @returns {Promise} API response
 */
export const matchProfile = async (query) => {
  try {
    console.log("Sending profile match request (fetch):", query);

    const response = await fetch(`${API_BASE_URL}/match-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Profile match response (fetch):", data);
    return data;
  } catch (error) {
    console.error("Profile match error details (fetch):", {
      message: error.message,
      name: error.name,
    });

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Cannot connect to server. Please ensure the backend is running on port 5000."
      );
    } else {
      throw new Error(error.message || "Failed to match profile");
    }
  }
};

/**
 * Get health status using fetch
 * @returns {Promise} API response
 */
export const getHealthStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to get health status");
  }
};

/**
 * Get available data sources using fetch
 * @returns {Promise} API response
 */
export const getDataSources = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/data-sources`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to get data sources");
  }
};

/**
 * Get test data using fetch
 * @returns {Promise} API response
 */
export const getTestData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test-data`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to get test data");
  }
};

export default {
  matchProfile,
  getHealthStatus,
  getDataSources,
  getTestData,
};

// API Client built on top of the existing fetchWithConfig function
import { fetchWithConfig } from './api';

// Constants for API URLs - these should match what's in api.js
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://investors-daily-brief.onrender.com'  // ✅ FIXED: Correct backend URL
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

/**
 * Enhanced API client for use with React Query
 */
export const apiClient = {
  /**
   * Perform a GET request
   * @param {string} endpoint - API endpoint (without /api prefix)
   * @returns {Promise<any>} - Response data
   */
  get: async (endpoint) => {
    return fetchWithConfig(endpoint);
  },
  
  /**
   * Perform a POST request
   * @param {string} endpoint - API endpoint (without /api prefix)
   * @param {object} data - Request body data
   * @returns {Promise<any>} - Response data
   */
  post: async (endpoint, data) => {
    const url = `${API_BASE_URL}/api${endpoint}`;
    console.log(`Posting to URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.warn(`API request failed: ${url} returned status ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    return responseData;
  }
};

export default apiClient;
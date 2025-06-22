/**
 * API Diagnostic Utility
 * This utility helps diagnose and fix common API connectivity issues
 */

// Test connection to backend server
export const testBackendConnection = async () => {
  const API_BASE_URL = 'http://localhost:5000';
  const results = {
    serverReachable: false,
    corsConfigured: false,
    apiEndpoints: {},
    errors: []
  };

  try {
    // 1. Simple ping test with no CORS requirements
    const pingResponse = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'HEAD',
      mode: 'no-cors' // This will succeed even without CORS headers
    });
    
    results.serverReachable = true;
    
    // 2. Test with CORS requirements
    try {
      const corsResponse = await fetch(`${API_BASE_URL}/api/health`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (corsResponse.ok) {
        results.corsConfigured = true;
      }
    } catch (corsError) {
      results.errors.push({
        type: 'CORS',
        message: corsError.message,
        solution: 'Backend server needs CORS headers configured properly.'
      });
    }
    
    // 3. Test specific API endpoints
    const endpointsToTest = [
      '/api/market/data',
      '/api/market/news',
      '/api/market/sectors',
      '/api/market/history/SPY.US?months=12'
    ];
    
    for (const endpoint of endpointsToTest) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        results.apiEndpoints[endpoint] = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
        
        if (!response.ok) {
          results.errors.push({
            type: 'API',
            endpoint,
            status: response.status,
            message: response.statusText,
            solution: 'Endpoint may be unavailable or returning errors.'
          });
        }
      } catch (apiError) {
        results.apiEndpoints[endpoint] = {
          error: apiError.message
        };
        
        results.errors.push({
          type: 'API',
          endpoint,
          message: apiError.message,
          solution: apiError.name === 'AbortError' 
            ? 'Endpoint timed out. Backend may be overloaded or unresponsive.'
            : 'Could not connect to endpoint.'
        });
      }
    }
    
  } catch (error) {
    results.errors.push({
      type: 'SERVER',
      message: error.message,
      solution: 'Backend server may be down or unreachable.'
    });
  }
  
  return results;
};

// Check if backend server is running
export const isBackendRunning = async () => {
  try {
    await fetch('http://localhost:5000/api/health', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(2000)
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Function to provide recommended fixes based on diagnostic results
export const getRecommendedFixes = (diagnosticResults) => {
  const fixes = [];
  
  if (!diagnosticResults.serverReachable) {
    fixes.push({
      issue: 'Backend server is not reachable',
      fix: `
      1. Make sure the backend server is running with:
         cd backend
         npm start
         
      2. Check for any error messages in the backend console
      3. Verify the port is correct (currently using 5000)
      `
    });
    
    return fixes; // No point checking other issues if server is down
  }
  
  if (!diagnosticResults.corsConfigured) {
    fixes.push({
      issue: 'CORS is not properly configured on the backend',
      fix: `
      Add the following to your backend server:
      
      // In backend/src/app.js or backend/index.js
      const cors = require('cors');
      app.use(cors());
      
      Make sure you have cors installed:
      npm install cors --save
      
      Then restart the backend server.
      `
    });
  }
  
  const timeoutErrors = diagnosticResults.errors.filter(e => e.message.includes('timed out'));
  if (timeoutErrors.length > 0) {
    fixes.push({
      issue: 'API endpoints are timing out',
      fix: `
      1. Check if the backend server is overwhelmed
      2. Increase timeout settings in the frontend
      3. Check for long-running database queries or external API calls
      4. Consider implementing caching on the backend for expensive operations
      `
    });
  }
  
  return fixes;
};

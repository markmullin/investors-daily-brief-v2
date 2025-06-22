/**
 * Connectivity Service
 * Manages and monitors connectivity to backend services
 */

import apiConnector from '../../utils/apiConnector';

// Service state
const state = {
  directConnection: {
    status: 'checking',
    lastChecked: null,
    details: null
  },
  corsProxy: {
    status: 'checking',
    lastChecked: null,
    details: null
  },
  apiEndpoints: {
    status: 'checking',
    lastChecked: null,
    details: null
  },
  marketData: {
    status: 'checking',
    lastChecked: null,
    indices: []
  },
  listeners: [],
  checkInterval: null,
  isChecking: false
};

/**
 * Check direct backend connection
 */
const checkDirectConnection = async () => {
  try {
    // Temporarily disable proxy for this check
    const wasProxyEnabled = apiConnector.proxyEnabled;
    apiConnector.disableProxy();
    
    const response = await apiConnector.get('/health', { 
      timeout: 5000, 
      cache: false,
      _retried: true // Prevent auto-switching to proxy
    });
    
    // Restore previous proxy state
    if (wasProxyEnabled) {
      apiConnector.enableProxy();
    }
    
    state.directConnection = {
      status: 'connected',
      lastChecked: Date.now(),
      details: response
    };
    
    return true;
  } catch (error) {
    state.directConnection = {
      status: 'error',
      lastChecked: Date.now(),
      error: error.message,
      details: error
    };
    
    return false;
  }
};

/**
 * Check CORS proxy connection
 */
const checkCorsProxy = async () => {
  try {
    // Temporarily enable proxy for this check
    const wasProxyEnabled = apiConnector.proxyEnabled;
    apiConnector.enableProxy();
    
    const response = await apiConnector.get('/health', { 
      timeout: 5000, 
      cache: false,
      _retried: true // Prevent auto-switching
    });
    
    // Restore previous proxy state
    if (!wasProxyEnabled) {
      apiConnector.disableProxy();
    }
    
    state.corsProxy = {
      status: 'connected',
      lastChecked: Date.now(),
      details: response
    };
    
    return true;
  } catch (error) {
    state.corsProxy = {
      status: 'error',
      lastChecked: Date.now(),
      error: error.message,
      details: error
    };
    
    // Attempt to start CORS proxy via the backend API
    try {
      apiConnector.disableProxy(); // Use direct connection to start proxy
      await apiConnector.post('/api/connectivity/start-cors-proxy');
      
      // Wait a moment for the proxy to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again
      apiConnector.enableProxy();
      const retryResponse = await apiConnector.get('/health', { 
        timeout: 5000, 
        cache: false,
        _retried: true
      });
      
      state.corsProxy = {
        status: 'connected',
        lastChecked: Date.now(),
        details: retryResponse,
        restarted: true
      };
      
      return true;
    } catch (startError) {
      // Failed to start and connect to proxy
      return false;
    }
  }
};

/**
 * Check API endpoints
 */
const checkApiEndpoints = async () => {
  try {
    // Use current connection method (direct or proxy)
    const connectivity = await apiConnector.get('/api/connectivity/test', { 
      timeout: 8000,
      cache: false 
    });
    
    state.apiEndpoints = {
      status: 'connected',
      lastChecked: Date.now(),
      details: connectivity
    };
    
    return true;
  } catch (error) {
    state.apiEndpoints = {
      status: 'error',
      lastChecked: Date.now(),
      error: error.message,
      details: error
    };
    
    return false;
  }
};

/**
 * Check market data
 */
const checkMarketData = async () => {
  try {
    // Use current connection method (direct or proxy)
    const marketData = await apiConnector.get('/market/data', { 
      timeout: 8000,
      cache: false 
    });
    
    // Check if it's an array
    if (Array.isArray(marketData)) {
      // Extract the indices for display
      const indices = marketData.map(item => ({
        symbol: item.symbol || item.code,
        name: item.name,
        price: item.price,
        change: item.change,
        changePercent: item.changePercent
      }));
      
      state.marketData = {
        status: 'connected',
        lastChecked: Date.now(),
        indices,
        format: 'array'
      };
    } else if (marketData && typeof marketData === 'object') {
      // It's an object with keys, convert to array
      const indices = Object.keys(marketData).map(key => {
        const item = marketData[key];
        return {
          symbol: item.symbol || item.code || key,
          name: item.name,
          price: item.price,
          change: item.change,
          changePercent: item.changePercent
        };
      });
      
      state.marketData = {
        status: 'connected',
        lastChecked: Date.now(),
        indices,
        format: 'object'
      };
    } else {
      state.marketData = {
        status: 'error',
        lastChecked: Date.now(),
        error: 'Invalid market data format',
        format: typeof marketData
      };
      
      return false;
    }
    
    return true;
  } catch (error) {
    state.marketData = {
      status: 'error',
      lastChecked: Date.now(),
      error: error.message,
      details: error
    };
    
    return false;
  }
};

/**
 * Check all connectivity
 */
const checkAllConnectivity = async () => {
  if (state.isChecking) return state;
  
  state.isChecking = true;
  
  try {
    // Run checks in parallel
    const [directResult, proxyResult, apiResult, marketResult] = await Promise.allSettled([
      checkDirectConnection(),
      checkCorsProxy(),
      checkApiEndpoints(),
      checkMarketData()
    ]);
    
    // Notify listeners
    notifyListeners();
    
    return state;
  } catch (error) {
    console.error('Error during connectivity check:', error);
    return state;
  } finally {
    state.isChecking = false;
  }
};

/**
 * Notify all listeners of state changes
 */
const notifyListeners = () => {
  state.listeners.forEach(listener => {
    try {
      listener(state);
    } catch (error) {
      console.error('Error in connectivity listener:', error);
    }
  });
};

/**
 * Subscribe to connectivity state changes
 */
const subscribe = (listener) => {
  state.listeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    state.listeners = state.listeners.filter(l => l !== listener);
  };
};

/**
 * Start automatic connectivity checks
 */
const startAutomaticChecks = (interval = 60000) => {
  if (state.checkInterval) {
    clearInterval(state.checkInterval);
  }
  
  // Run an initial check
  checkAllConnectivity();
  
  // Set up interval checks
  state.checkInterval = setInterval(() => {
    checkAllConnectivity();
  }, interval);
  
  return () => stopAutomaticChecks();
};

/**
 * Stop automatic connectivity checks
 */
const stopAutomaticChecks = () => {
  if (state.checkInterval) {
    clearInterval(state.checkInterval);
    state.checkInterval = null;
  }
};

/**
 * Manual retry for connections
 */
const retryConnections = async () => {
  // Clear cache to ensure fresh data
  apiConnector.clearCache();
  
  // Try direct connection first
  apiConnector.disableProxy();
  const directConnected = await checkDirectConnection();
  
  // If direct fails, try proxy
  if (!directConnected) {
    apiConnector.enableProxy();
    await checkCorsProxy();
  }
  
  // Check other services after connection established
  await Promise.all([
    checkApiEndpoints(),
    checkMarketData()
  ]);
  
  notifyListeners();
  return state;
};

/**
 * Start CORS proxy
 */
const startCorsProxy = async () => {
  try {
    // Use direct connection to call the start endpoint
    const wasProxyEnabled = apiConnector.proxyEnabled;
    apiConnector.disableProxy();
    
    const result = await apiConnector.post('/api/connectivity/start-cors-proxy');
    
    // Restore previous state
    if (wasProxyEnabled) {
      apiConnector.enableProxy();
    }
    
    // Check connectivity after starting
    await checkAllConnectivity();
    
    return result;
  } catch (error) {
    console.error('Failed to start CORS proxy:', error);
    throw error;
  }
};

/**
 * Get current connectivity state
 */
const getState = () => {
  return { ...state };
};

// Initialize
const initialize = () => {
  // Run an initial check
  checkAllConnectivity();
  
  // Start automatic checks
  startAutomaticChecks(60000); // Check every minute
};

// Initialize on module load if window exists (browser environment)
if (typeof window !== 'undefined') {
  // Wait for DOM content to load
  if (document.readyState !== 'loading') {
    initialize();
  } else {
    document.addEventListener('DOMContentLoaded', initialize);
  }
}

export default {
  checkAllConnectivity,
  checkDirectConnection,
  checkCorsProxy,
  checkApiEndpoints,
  checkMarketData,
  subscribe,
  startAutomaticChecks,
  stopAutomaticChecks,
  retryConnections,
  startCorsProxy,
  getState,
  initialize
};
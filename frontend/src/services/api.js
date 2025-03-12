// Updated API Service with caching implementation
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://market-dashboard-backend.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

// Log configuration for debugging
console.log('API Service configuration:', {
  isProduction,
  API_BASE_URL,
  hostname: window.location.hostname
});

// Enhanced fetch with caching
export const fetchWithConfig = async (endpoint) => {
  try {
    // Construct URL correctly
    const url = `${API_BASE_URL}/api${endpoint}`;
    console.log(`Fetching from URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return null;
  }
};

// Enhanced fetch with caching
export const fetchWithCaching = async (endpoint, cacheDuration = 5 * 60 * 1000) => {
  const cacheKey = `market_dashboard_cache_${endpoint}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      // Check if cache is still valid
      if (Date.now() - timestamp < cacheDuration) {
        console.log(`Using cached data for ${endpoint}`);
        return data;
      }
    } catch (e) {
      console.error('Error parsing cached data', e);
    }
  }
  
  // If no valid cache, fetch fresh data
  const freshData = await fetchWithConfig(endpoint);
  
  // Cache the fresh data
  if (freshData) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Error caching data', e);
    }
  }
  
  return freshData;
};

// Handle null safely for the getHistory function
const safeMap = (data, mapFn) => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapFn);
};

// Updated API with caching
export const marketApi = {
  getData: () => fetchWithCaching('/market/data'),
  getSectors: () => fetchWithCaching('/market/sectors'),
  getMover: () => fetchWithCaching('/market/mover'),
  getMacro: () => fetchWithCaching('/market/macro'),
  getSectorRotation: () => fetchWithCaching('/market/sector-rotation'),
  getQuote: (symbol) => fetchWithCaching(`/market/quote/${symbol}`),
  getThemes: () => fetchWithCaching('/market/themes'),
  getInsights: () => fetchWithCaching('/market/insights'),
  getHistory: async (symbol) => {
    const data = await fetchWithCaching(`/market/history/${symbol}`);
    return safeMap(data, item => ({
      date: item?.date,
      price: item?.price || 0,
      ma200: typeof item?.ma200 === 'number' ? item.ma200 : null
    }));
  }
};

export const marketEnvironmentApi = {
  getScore: () => fetchWithCaching('/market-environment/score'),
};

export const industryAnalysisApi = {
  getAllPairs: (period = '1y') => fetchWithCaching(`/industry-analysis/all?period=${period}`),
  getPair: (pairKey, period = '1y') => fetchWithCaching(`/industry-analysis/${pairKey}?period=${period}`),
};

export const enhancedIndustryAnalysisApi = {
  getAllPairs: async (period = '1y') => {
    try {
      return await fetchWithCaching(`/industry-analysis/all?period=${period}`);
    } catch (error) {
      console.warn('Enhanced analysis failed, falling back to basic:', error);
      return industryAnalysisApi.getAllPairs(period);
    }
  },
  getPair: async (pairKey, period = '1y') => {
    try {
      return await fetchWithCaching(`/industry-analysis/${pairKey}?period=${period}`);
    } catch (error) {
      console.warn('Enhanced analysis failed, falling back to basic:', error);
      return industryAnalysisApi.getPair(pairKey, period);
    }
  },
};

export const macroAnalysisApi = {
  getAllGroups: (period = '1y') => fetchWithCaching(`/macro-analysis/all?period=${period}`),
  getGroup: (groupKey, period = '1y') => fetchWithCaching(`/macro-analysis/${groupKey}?period=${period}`),
};

export const enhancedMacroAnalysisApi = {
  getAllGroups: async (period = '1y') => {
    try {
      return await fetchWithCaching(`/macro-analysis/all?period=${period}`);
    } catch (error) {
      console.warn('Enhanced macro analysis failed, falling back to basic:', error);
      return macroAnalysisApi.getAllGroups(period);
    }
  },
  getGroup: async (groupKey, period = '1y') => {
    try {
      return await fetchWithCaching(`/macro-analysis/${groupKey}?period=${period}`);
    } catch (error) {
      console.warn('Enhanced macro analysis failed, falling back to basic:', error);
      return macroAnalysisApi.getGroup(groupKey, period);
    }
  },
};
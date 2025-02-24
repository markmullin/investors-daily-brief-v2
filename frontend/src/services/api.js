const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchWithConfig = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
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

export const marketApi = {
  getData: () => fetchWithConfig('/market/data'),
  getSectors: () => fetchWithConfig('/market/sectors'),
  getMover: () => fetchWithConfig('/market/mover'),
  getMacro: () => fetchWithConfig('/market/macro'),
  getSectorRotation: () => fetchWithConfig('/market/sector-rotation'),
  getQuote: (symbol) => fetchWithConfig(`/market/quote/${symbol}`),
  getThemes: () => fetchWithConfig('/market/themes'),
  getInsights: () => fetchWithConfig('/market/insights'),
  getHistory: async (symbol) => {
    const data = await fetchWithConfig(`/market/history/${symbol}`);
    return data.map(item => ({
      date: item.date,
      price: item.price || 0,
      ma200: typeof item.ma200 === 'number' ? item.ma200 : null
    }));
  }
};

export const marketEnvironmentApi = {
  getScore: () => fetchWithConfig('/market-environment/score'),
};

export const industryAnalysisApi = {
  getAllPairs: (period = '1y') => fetchWithConfig(`/industry-analysis/all?period=${period}`),
  getPair: (pairKey, period = '1y') => fetchWithConfig(`/industry-analysis/${pairKey}?period=${period}`),
};

export const enhancedIndustryAnalysisApi = {
  getAllPairs: async (period = '1y') => {
    try {
      return await fetchWithConfig(`/industry-analysis/all?period=${period}`);
    } catch (error) {
      console.warn('Enhanced analysis failed, falling back to basic:', error);
      return industryAnalysisApi.getAllPairs(period);
    }
  },
  getPair: async (pairKey, period = '1y') => {
    try {
      return await fetchWithConfig(`/industry-analysis/${pairKey}?period=${period}`);
    } catch (error) {
      console.warn('Enhanced analysis failed, falling back to basic:', error);
      return industryAnalysisApi.getPair(pairKey, period);
    }
  },
};

export const macroAnalysisApi = {
  getAllGroups: (period = '1y') => fetchWithConfig(`/macro-analysis/all?period=${period}`),
  getGroup: (groupKey, period = '1y') => fetchWithConfig(`/macro-analysis/${groupKey}?period=${period}`),
};

export const enhancedMacroAnalysisApi = {
  getAllGroups: async (period = '1y') => {
    try {
      return await fetchWithConfig(`/macro-analysis/all?period=${period}`);
    } catch (error) {
      console.warn('Enhanced macro analysis failed, falling back to basic:', error);
      return macroAnalysisApi.getAllGroups(period);
    }
  },
  getGroup: async (groupKey, period = '1y') => {
    try {
      return await fetchWithConfig(`/macro-analysis/${groupKey}?period=${period}`);
    } catch (error) {
      console.warn('Enhanced macro analysis failed, falling back to basic:', error);
      return macroAnalysisApi.getGroup(groupKey, period);
    }
  },
};
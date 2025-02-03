const API_BASE_URL = 'http://localhost:5000/api';

export const fetchWithConfig = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
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
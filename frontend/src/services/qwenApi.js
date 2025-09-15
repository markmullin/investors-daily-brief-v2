// Qwen Analysis API Service
// Integrates with backend Qwen 3 8B analysis pipeline

const QWEN_API_BASE = 'http://localhost:5000/api/qwen-analysis';

export const qwenAnalysisApi = {
  // Market Environment Analysis
  async getMarketAnalysis(marketData) {
    try {
      const response = await fetch(`${QWEN_API_BASE}/market-environment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketData })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.analysis;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Qwen market analysis:', error);
      return null;
    }
  },

  // Indices Analysis
  async getIndicesAnalysis(indicesData) {
    try {
      const response = await fetch(`${QWEN_API_BASE}/indices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicesData })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.analysis;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Qwen indices analysis:', error);
      return null;
    }
  },

  // Sector Analysis
  async getSectorAnalysis(sectorData) {
    try {
      const response = await fetch(`${QWEN_API_BASE}/sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorData })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.analysis;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Qwen sector analysis:', error);
      return null;
    }
  },

  // Correlation Analysis
  async getCorrelationAnalysis(correlationData) {
    try {
      const response = await fetch(`${QWEN_API_BASE}/correlations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correlationData })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.analysis;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Qwen correlation analysis:', error);
      return null;
    }
  },

  // Macro Analysis
  async getMacroAnalysis(macroData) {
    try {
      const response = await fetch(`${QWEN_API_BASE}/macro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ macroData })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.analysis;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Qwen macro analysis:', error);
      return null;
    }
  }
};

// Export for use in components
export default qwenAnalysisApi;

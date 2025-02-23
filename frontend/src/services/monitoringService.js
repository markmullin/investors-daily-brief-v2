import { fetchWithConfig } from './api';

// Default monitoring data when endpoint is unavailable
const defaultMonitoringData = {
  monitoring: {
    regimes: {
      current: {
        riskRegime: "Risk-On",
        volatilityRegime: "Normal"
      }
    },
    risks: {
      level: "Low"
    }
  },
  score: 75
};

const handleRequest = async (endpoint, options = {}) => {
  try {
    return await fetchWithConfig(endpoint, options);
  } catch (error) {
    console.warn(`Monitoring API error for ${endpoint}:`, error.message);
    return defaultMonitoringData;
  }
};

export const monitoringService = {
  // Initialize monitoring
  initializeMonitoring: () => 
    handleRequest('/monitoring/initialize', { method: 'POST' }),

  // Get current monitoring state
  getMonitoringState: () => 
    handleRequest('/monitoring/state'),

  // Get latest alerts
  getMonitoringAlerts: () => 
    handleRequest('/monitoring/alerts')
};

export default monitoringService;
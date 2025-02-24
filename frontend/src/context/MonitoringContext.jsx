import React, { createContext, useContext, useEffect, useState } from 'react';
import monitoringService from '../services/monitoringService';
import monitoringWebSocket from '../services/monitoringWebSocket';

const MonitoringContext = createContext(null);

// Default monitoring data when API is unavailable
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

export const MonitoringProvider = ({ children }) => {
  const [monitoringState, setMonitoringState] = useState({
    status: 'initializing',
    data: null,
    alerts: [],
    error: null
  });

  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        const initialState = await monitoringService.initializeMonitoring();
        setMonitoringState(prev => ({
          ...prev,
          status: 'active',
          data: initialState
        }));
      } catch (error) {
        console.error('Error initializing monitoring:', error);
        // Provide fallback data instead of just setting error state
        setMonitoringState(prev => ({
          ...prev,
          status: 'active',
          data: {
            monitoring: {
              regimes: {
                current: {
                  riskRegime: 'Neutral',
                  volatilityRegime: 'Normal'
                }
              },
              risks: {
                level: 'Moderate'
              }
            },
            score: 50
          },
          error: 'Using fallback data, monitoring service unavailable'
        }));
      }
    };

    initializeMonitoring();

    // Subscribe to WebSocket updates only if enabled
    const unsubscribe = monitoringWebSocket.subscribe(({ type, data }) => {
      if (!type || !data) return; // Skip if incomplete data
      
      switch (type) {
        case 'state':
          setMonitoringState(prev => ({
            ...prev,
            status: 'active',
            data
          }));
          break;

        case 'update':
          setMonitoringState(prev => ({
            ...prev,
            data: {
              ...prev.data,
              ...data
            },
            alerts: [...(data.alerts || []), ...prev.alerts].slice(0, 10) // Keep last 10 alerts
          }));
          break;

        case 'error':
          console.warn('WebSocket monitoring error:', data);
          // Don't update state on websocket errors
          break;

        default:
          console.warn('Unknown monitoring update type:', type);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    ...monitoringState,
    clearAlerts: () => setMonitoringState(prev => ({ ...prev, alerts: [] }))
  };

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

export default MonitoringContext;
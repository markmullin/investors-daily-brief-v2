import { useState, useEffect } from 'react';
import { socket } from '../services/websocket';

export const useMarketMonitoring = () => {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/market/monitoring');
        const data = await response.json();
        setMonitoringData(data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up WebSocket listeners
    socket.on('monitoringUpdate', (data) => {
      setMonitoringData(data);
    });

    socket.on('monitoringError', (err) => {
      setError(err);
    });

    return () => {
      socket.off('monitoringUpdate');
      socket.off('monitoringError');
    };
  }, []);

  return { monitoringData, loading, error };
};
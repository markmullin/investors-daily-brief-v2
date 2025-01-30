import { useState, useEffect } from 'react';
import { marketApi } from '../services/api';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState([]);
  const [historicalData, setHistoricalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch market data
        const data = await marketApi.getData();
        
        // Convert data object to array and filter main indices
        const mainIndices = ['SPY', 'QQQ', 'DIA', 'IWM'];
        const marketDataArray = Object.entries(data)
          .map(([symbol, quote]) => ({
            symbol,
            ...quote
          }))
          .filter(item => mainIndices.includes(item.symbol));

        setMarketData(marketDataArray);

        // Fetch historical data for each symbol
        const historicalDataPromises = mainIndices.map(async (symbol) => {
          const history = await marketApi.getHistory(symbol);
          return [symbol, history];
        });

        const historicalResults = await Promise.all(historicalDataPromises);
        const historicalObj = Object.fromEntries(historicalResults);
        setHistoricalData(historicalObj);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return { marketData, historicalData, loading, error };
};
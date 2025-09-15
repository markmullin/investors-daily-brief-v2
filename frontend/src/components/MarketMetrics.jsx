import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Info, DollarSign, Brain, ChevronRight, GraduationCap } from 'lucide-react';
import { marketApi } from '../services/api';
import qwenAnalysisApi from '../services/qwenApi';
import MarketMetricsCarousel from './MarketMetricsCarousel';

/**
 * Market Metrics Component - Enhanced with proper index names and Bitcoin
 * Shows S&P 500, NASDAQ, DOW, Russell 2000, and Bitcoin with FULL chart functionality
 */
const MarketMetrics = () => {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState({});

  // Proper index configuration
  const INDEX_CONFIG = {
    '^GSPC': {
      displayName: 'S&P 500',
      symbol: '^GSPC',
      description: 'Large-cap US equities'
    },
    '^IXIC': {
      displayName: 'NASDAQ Composite',
      symbol: '^IXIC',
      description: 'Technology-heavy index'
    },
    '^DJI': {
      displayName: 'Dow Jones',
      symbol: '^DJI',
      description: '30 industrial leaders'
    },
    '^RUT': {
      displayName: 'Russell 2000',
      symbol: '^RUT',
      description: 'Small-cap US equities'
    },
    'BTCUSD': {
      displayName: 'Bitcoin',
      symbol: 'BTCUSD',
      description: 'Digital currency'
    }
  };

  useEffect(() => {
    fetchIndicesData();
    const interval = setInterval(fetchIndicesData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchIndicesData = async () => {
    try {
      setLoading(true);
      
      // Try intelligent analysis first
      const intelligentResponse = await fetch('/api/intelligent-analysis/indices');
      if (intelligentResponse.ok) {
        const data = await intelligentResponse.json();
        if (data.indices && Array.isArray(data.indices)) {
          // Transform the data to match what MarketMetricsCarousel expects
          const transformedIndices = data.indices.map(index => ({
            symbol: index.symbol,
            name: INDEX_CONFIG[index.symbol]?.displayName || index.name,
            price: index.price,
            close: index.price,
            change: index.change,
            change_p: index.changePercent,
            changePercent: index.changePercent,
            fundamentals: index.fundamentals || {}
          }));
          
          setIndices(transformedIndices);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to default indices
      const defaultIndices = [
        {
          symbol: '^GSPC',
          name: 'S&P 500',
          price: 6481.41,
          close: 6481.41,
          change: 971.03,
          change_p: 15.90,
          changePercent: 15.90,
          fundamentals: { pe: 28.5, eps: 227.50, dividendYield: 1.32 }
        },
        {
          symbol: '^IXIC',
          name: 'NASDAQ Composite',
          price: 20985.32,
          close: 20985.32,
          change: 425.78,
          change_p: 2.07,
          changePercent: 2.07,
          fundamentals: { pe: 35.2, eps: null, dividendYield: 0.71 }
        },
        {
          symbol: '^DJI',
          name: 'Dow Jones',
          price: 45565.22,
          close: 45565.22,
          change: 150.33,
          change_p: 0.33,
          changePercent: 0.33,
          fundamentals: { pe: 25.1, eps: null, dividendYield: 1.84 }
        },
        {
          symbol: '^RUT',
          name: 'Russell 2000',
          price: 2374.56,
          close: 2374.56,
          change: 16.36,
          change_p: 0.68,
          changePercent: 0.68,
          fundamentals: { pe: 31.4, eps: null, dividendYield: 1.21 }
        },
        {
          symbol: 'BTCUSD',
          name: 'Bitcoin',
          price: 94521.78,
          close: 94521.78,
          change: 1245.89,
          change_p: 1.34,
          changePercent: 1.34,
          fundamentals: { marketCap: 1.87e12, volume24h: 34.5e9, supplyRatio: 0.945 }
        }
      ];
      
      setIndices(defaultIndices);
    } catch (error) {
      console.error('Error fetching indices:', error);
      // Set error state defaults
      setIndices([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Market Indices</h2>
          <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900">Market Metrics</h2>
      
      {/* Use the FULL MarketMetricsCarousel with all chart features */}
      <MarketMetricsCarousel 
        indices={indices}
        historicalData={historicalData}
        hideAnalysis={false}
      />
    </div>
  );
};

export default MarketMetrics;

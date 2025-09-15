import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

// Use environment variable for API URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const NewsTicker = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎯 NewsTicker: Fetching S&P 500 companies from simple endpoint...');
      
      const response = await fetch(`${API_BASE_URL}/api/simple/sp500-top`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No stock data received from API');
      }

      console.log(`✅ NewsTicker: Received ${data.length} live stock quotes`);
      setStocks(data);
      
    } catch (err) {
      console.error('❌ NewsTicker: Error fetching live market data:', err.message);
      setError(`Failed to load live market data: ${err.message}`);
      setStocks([]); // Clear any existing data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStockData();
  };

  useEffect(() => {
    fetchStockData();
    
    // Set up refresh interval - 1 minute for live stock prices
    const interval = setInterval(() => {
      fetchStockData();
    }, 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  const getChangeIcon = (changePercent) => {
    const change = Number(changePercent);
    if (change > 0) {
      return <ArrowUp size={12} className="inline" />;
    } else if (change < 0) {
      return <ArrowDown size={12} className="inline" />;
    }
    return null;
  };

  const getChangeColor = (changePercent) => {
    const change = Number(changePercent);
    if (change > 0) {
      return 'text-green-600';
    } else if (change < 0) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const formatChangePercent = (changePercent) => {
    return Math.abs(Number(changePercent)).toFixed(2);
  };

  return (
    <div className="w-full bg-white text-black py-2 overflow-hidden border-b border-gray-200">
      <div className="relative flex items-center">
        <div className="flex items-center px-4 pr-2 border-r border-gray-300 mr-4">
          <TrendingUp className="text-black mr-2" size={16} />
          <span className="font-semibold text-black whitespace-nowrap">S&P 500</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track">
            <div className="ticker-content">
              {loading && stocks.length === 0 ? (
                <span className="text-gray-600">Loading live market data...</span>
              ) : error ? (
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-red-600">{error}</span>
                </div>
              ) : stocks.length > 0 ? (
                <>
                  {/* First set of stocks */}
                  {stocks.map((stock, index) => (
                    <span key={`stock-${stock.symbol}-${index}`} className="ticker-item inline-flex items-center">
                      <span className="font-medium mr-2">{stock.symbol}</span>
                      <span className="mr-2">${formatPrice(stock.price || stock.close)}</span>
                      <span className={`inline-flex items-center ${getChangeColor(stock.changePercent || stock.change_p)}`}>
                        {getChangeIcon(stock.changePercent || stock.change_p)}
                        <span className="ml-1">{formatChangePercent(stock.changePercent || stock.change_p)}%</span>
                      </span>
                      {index < stocks.length - 1 && <span className="text-gray-400 mx-3">•</span>}
                    </span>
                  ))}
                  {/* Duplicate content for continuous scroll */}
                  <span className="text-gray-400 mx-3">•</span>
                  {stocks.map((stock, index) => (
                    <span key={`dup-stock-${stock.symbol}-${index}`} className="ticker-item inline-flex items-center">
                      <span className="font-medium mr-2">{stock.symbol}</span>
                      <span className="mr-2">${formatPrice(stock.price || stock.close)}</span>
                      <span className={`inline-flex items-center ${getChangeColor(stock.changePercent || stock.change_p)}`}>
                        {getChangeIcon(stock.changePercent || stock.change_p)}
                        <span className="ml-1">{formatChangePercent(stock.changePercent || stock.change_p)}%</span>
                      </span>
                      {index < stocks.length - 1 && <span className="text-gray-400 mx-3">•</span>}
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-gray-600">No live market data available</span>
              )}
            </div>
          </div>
          
          {/* Error refresh button */}
          {error && (
            <button
              onClick={handleRefresh}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-600 hover:text-black bg-gray-100 rounded transition-colors"
              disabled={refreshing}
              title="Retry loading live data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>
      
      <style jsx="true">{`
        .ticker-track {
          display: flex;
        }
        .ticker-content {
          display: flex;
          white-space: nowrap;
          animation: ticker 90s linear infinite;
        }
        .ticker-item {
          padding-right: 2rem;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (hover: hover) {
          .ticker-content:hover {
            animation-play-state: paused;
          }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
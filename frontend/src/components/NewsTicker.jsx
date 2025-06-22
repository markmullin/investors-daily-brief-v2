import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { marketApi } from '../services/api';

// Use environment variable for API URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const NewsTicker = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Top S&P 500 companies by market cap (as of 2024-2025)
  const sp500TopCompanies = [
    'AAPL',  // Apple
    'MSFT',  // Microsoft
    'NVDA',  // NVIDIA
    'AMZN',  // Amazon
    'GOOGL', // Alphabet Class A
    'META',  // Meta (Facebook)
    'BRK.B', // Berkshire Hathaway
    'TSLA',  // Tesla
    'LLY',   // Eli Lilly
    'JPM',   // JPMorgan Chase
    'V',     // Visa
    'UNH',   // UnitedHealth
    'WMT',   // Walmart
    'MA',    // Mastercard
    'JNJ',   // Johnson & Johnson
    'XOM',   // Exxon Mobil
    'HD',    // Home Depot
    'PG',    // Procter & Gamble
    'AVGO',  // Broadcom
    'ORCL'   // Oracle
  ];

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, we'll fetch the main indices as a fallback
      // In production, you'd want to fetch individual stock data
      const response = await fetch(`${API_BASE_URL}/api/market/sp500-top`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStocks(data);
      } else {
        // Fallback data for demo - these would be fetched from API
        const demoStocks = [
          { symbol: 'AAPL', price: 183.79, changePercent: 0.45 },
          { symbol: 'MSFT', price: 428.70, changePercent: -0.32 },
          { symbol: 'NVDA', price: 796.77, changePercent: 1.24 },
          { symbol: 'AMZN', price: 178.35, changePercent: -0.68 },
          { symbol: 'GOOGL', price: 145.94, changePercent: 0.22 },
          { symbol: 'META', price: 474.99, changePercent: -1.15 },
          { symbol: 'BRK.B', price: 412.36, changePercent: 0.17 },
          { symbol: 'TSLA', price: 208.14, changePercent: 2.35 },
          { symbol: 'LLY', price: 748.52, changePercent: -0.48 },
          { symbol: 'JPM', price: 199.62, changePercent: 0.93 },
          { symbol: 'V', price: 272.44, changePercent: -0.27 },
          { symbol: 'UNH', price: 521.03, changePercent: 0.37 },
          { symbol: 'WMT', price: 67.26, changePercent: 0.65 },
          { symbol: 'MA', price: 476.78, changePercent: -0.11 },
          { symbol: 'JNJ', price: 156.74, changePercent: 0.21 }
        ];
        setStocks(demoStocks);
      }
    } catch (err) {
      console.error('Error fetching S&P 500 data:', err);
      // Use fallback data
      const fallbackStocks = sp500TopCompanies.slice(0, 10).map(symbol => ({
        symbol,
        price: Math.random() * 500 + 100,
        changePercent: (Math.random() - 0.5) * 4
      }));
      setStocks(fallbackStocks);
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
    
    // Set up refresh interval - 1 minute for stock prices
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

  return (
    <div className="w-full bg-white text-black py-2 overflow-hidden border-b border-gray-200">
      <div className="relative flex items-center">
        <div className="flex items-center px-4 pr-2 border-r border-gray-300 mr-4">
          <TrendingUp className="text-black mr-2" size={16} />
          <span className="font-semibold text-black whitespace-nowrap">Market News</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track">
            <div className="ticker-content">
              {loading && stocks.length === 0 ? (
                <span className="text-gray-600">Loading S&P 500 data...</span>
              ) : error ? (
                <span className="text-red-600">Error: {error}</span>
              ) : stocks.length > 0 ? (
                <>
                  {/* First set of stocks */}
                  {stocks.map((stock, index) => (
                    <span key={`stock-${stock.symbol}-${index}`} className="ticker-item inline-flex items-center">
                      <span className="font-medium mr-2">Stock Price: {stock.symbol}</span>
                      <span className="mr-2">${Number(stock.price).toFixed(2)}</span>
                      <span className={`inline-flex items-center ${getChangeColor(stock.changePercent)}`}>
                        {getChangeIcon(stock.changePercent)}
                        <span className="ml-1">{Math.abs(Number(stock.changePercent)).toFixed(2)}%</span>
                      </span>
                      {index < stocks.length - 1 && <span className="text-gray-400 mx-3">•</span>}
                    </span>
                  ))}
                  {/* Duplicate content for continuous scroll */}
                  <span className="text-gray-400 mx-3">•</span>
                  {stocks.map((stock, index) => (
                    <span key={`dup-stock-${stock.symbol}-${index}`} className="ticker-item inline-flex items-center">
                      <span className="font-medium mr-2">Stock Price: {stock.symbol}</span>
                      <span className="mr-2">${Number(stock.price).toFixed(2)}</span>
                      <span className={`inline-flex items-center ${getChangeColor(stock.changePercent)}`}>
                        {getChangeIcon(stock.changePercent)}
                        <span className="ml-1">{Math.abs(Number(stock.changePercent)).toFixed(2)}%</span>
                      </span>
                      {index < stocks.length - 1 && <span className="text-gray-400 mx-3">•</span>}
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-gray-600">No stock data available</span>
              )}
            </div>
          </div>
          
          {/* Error refresh button */}
          {error && (
            <button
              onClick={handleRefresh}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-600 hover:text-black bg-gray-100 rounded"
              disabled={refreshing}
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
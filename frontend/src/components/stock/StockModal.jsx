import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { marketApi } from '../../services/api';
import StockPriceCharts from './StockPriceCharts';
import FundamentalsCharts from './FundamentalsCharts';
import FundamentalsTab from './FundamentalsTab';

/**
 * Enhanced Stock Modal Component - Modular and Production Ready
 * 
 * This component provides a comprehensive stock analysis interface with:
 * - Real-time price charts with technical indicators
 * - Fundamental analysis with SEC EDGAR data
 * - Multiple time periods for historical analysis
 * - Modular component architecture for maintainability
 */
const StockModal = ({ stock, onClose }) => {
  // Core state management
  const [activeTab, setActiveTab] = useState('charts');
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [historicalData, setHistoricalData] = useState([]);
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [loading, setLoading] = useState({
    historical: false,
    fundamentals: false
  });
  const [errors, setErrors] = useState({
    historical: null,
    fundamentals: null
  });

  // Safely access stock data with fallbacks
  const safeStock = {
    symbol: stock?.symbol || 'N/A',
    name: stock?.name || stock?.shortName || 'Unknown Company',
    price: Number(stock?.price || stock?.regularMarketPrice || 0),
    change: Number(stock?.change || stock?.regularMarketChange || 0),
    change_p: Number(stock?.change_p || stock?.regularMarketChangePercent || 0),
    ...stock
  };

  // Available time periods for historical data
  const periods = [
    { value: '1d', label: '1D', api: '1d' },
    { value: '5d', label: '5D', api: '5d' },
    { value: '1m', label: '1M', api: '1mo' },
    { value: '3m', label: '3M', api: '3mo' },
    { value: '6m', label: '6M', api: '6mo' },
    { value: '1y', label: '1Y', api: '1y' },
    { value: '5y', label: '5Y', api: '5y' }
  ];

  /**
   * Fetch historical price data for charts
   */
  const fetchHistoricalData = async (period) => {
    if (!safeStock.symbol || safeStock.symbol === 'N/A') {
      console.warn('No valid symbol provided for historical data');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, historical: true }));
      setErrors(prev => ({ ...prev, historical: null }));

      console.log(`Fetching historical data for ${safeStock.symbol}, period: ${period}`);
      
      const periodConfig = periods.find(p => p.value === period);
      const apiPeriod = periodConfig?.api || '1y';
      
      const data = await marketApi.getHistoricalData(safeStock.symbol, apiPeriod);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setHistoricalData(data);
        console.log(`Successfully loaded ${data.length} historical data points`);
      } else {
        console.warn('No historical data received');
        setHistoricalData([]);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setErrors(prev => ({ 
        ...prev, 
        historical: `Failed to load historical data: ${error.message}` 
      }));
      setHistoricalData([]);
    } finally {
      setLoading(prev => ({ ...prev, historical: false }));
    }
  };

  /**
   * Fetch fundamental data for analysis
   */
  const fetchFundamentalsData = async () => {
    if (!safeStock.symbol || safeStock.symbol === 'N/A') {
      console.warn('No valid symbol provided for fundamentals');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, fundamentals: true }));
      setErrors(prev => ({ ...prev, fundamentals: null }));

      console.log(`Fetching fundamentals for ${safeStock.symbol}`);
      const data = await marketApi.getFundamentals(safeStock.symbol);
      
      setFundamentalsData(data);
      console.log('Successfully loaded fundamentals data');
    } catch (error) {
      console.error('Error fetching fundamentals:', error);
      setErrors(prev => ({ 
        ...prev, 
        fundamentals: `Failed to load fundamentals: ${error.message}` 
      }));
    } finally {
      setLoading(prev => ({ ...prev, fundamentals: false }));
    }
  };

  // Initial data loading
  useEffect(() => {
    if (safeStock.symbol && safeStock.symbol !== 'N/A') {
      fetchHistoricalData(selectedPeriod);
      fetchFundamentalsData();
    }
  }, [safeStock.symbol]);

  // Handle period changes
  useEffect(() => {
    if (safeStock.symbol && safeStock.symbol !== 'N/A') {
      fetchHistoricalData(selectedPeriod);
    }
  }, [selectedPeriod]);

  /**
   * Handle period selection
   */
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  /**
   * Handle tab switching
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  /**
   * Handle modal close with cleanup
   */
  const handleClose = () => {
    // Reset state on close
    setActiveTab('charts');
    setSelectedPeriod('1y');
    setHistoricalData([]);
    setFundamentalsData(null);
    setLoading({ historical: false, fundamentals: false });
    setErrors({ historical: null, fundamentals: null });
    
    if (onClose) {
      onClose();
    }
  };

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate display values
  const isPositiveChange = safeStock.change_p >= 0;
  const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600';
  const ChangeIcon = isPositiveChange ? TrendingUp : TrendingDown;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{safeStock.symbol}</h2>
              <p className="text-gray-600 text-sm">{safeStock.name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ${safeStock.price.toFixed(2)}
                </p>
                <div className={`flex items-center space-x-1 ${changeColor}`}>
                  <ChangeIcon size={16} />
                  <span className="font-semibold">
                    {isPositiveChange ? '+' : ''}${safeStock.change.toFixed(2)} 
                    ({isPositiveChange ? '+' : ''}{safeStock.change_p.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1">
            <button
              onClick={() => handleTabChange('charts')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'charts'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <BarChart3 size={16} />
              Price Charts
            </button>
            
            <button
              onClick={() => handleTabChange('fundamentals')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'fundamentals'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <TrendingUp size={16} />
              Fundamentals
            </button>
          </div>

          {/* Period Selector - Only show for Charts tab */}
          {activeTab === 'charts' && (
            <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => handlePeriodChange(period.value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedPeriod === period.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'charts' && (
            <div className="p-6">
              {/* Price Charts Section */}
              <StockPriceCharts
                historicalData={historicalData}
                loading={loading.historical}
                selectedPeriod={selectedPeriod}
                safeStock={safeStock}
              />
              
              {/* Historical Data Error Display */}
              {errors.historical && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{errors.historical}</p>
                  <button
                    onClick={() => fetchHistoricalData(selectedPeriod)}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Fundamentals Charts Section */}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Performance</h3>
                <FundamentalsCharts
                  fundamentalsData={fundamentalsData}
                  loading={loading.fundamentals}
                  error={errors.fundamentals}
                />
              </div>
            </div>
          )}

          {activeTab === 'fundamentals' && (
            <div className="p-6">
              <FundamentalsTab symbol={safeStock.symbol} />
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {(loading.historical || loading.fundamentals) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 font-medium">
                {loading.historical ? 'Loading price data...' : 'Loading fundamentals...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockModal;
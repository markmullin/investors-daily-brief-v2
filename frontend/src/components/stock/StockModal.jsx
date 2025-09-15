import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, Building, DollarSign, Calculator } from 'lucide-react';
import { marketApi } from '../../services/api';
import OverviewTab from './OverviewTab';
import FundamentalsTab from './FundamentalsTab';
import GrowthTab from './GrowthTab';
import ValuationTab from './ValuationTab';

/**
 * Enhanced Stock Modal Component - Bloomberg Terminal Grade Analysis
 * 
 * This component provides a comprehensive 4-tab stock analysis interface with:
 * - Overview: Price charts, circular scores, investment thesis
 * - Financials: Comprehensive fundamental analysis 
 * - Growth: Revenue/earnings growth charts and analysis
 * - Valuation: DCF calculator, peer comparison, price targets
 */
const StockModal = ({ stock, onClose }) => {
  // Core state management
  const [activeTab, setActiveTab] = useState('overview');
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
    price: Number(stock?.price || stock?.regularMarketPrice || stock?.close || 0),
    change: Number(stock?.change || stock?.regularMarketChange || 0),
    change_p: Number(stock?.change_p || stock?.regularMarketChangePercent || 0),
    high: Number(stock?.high || stock?.regularMarketDayHigh || stock?.price || 0),
    low: Number(stock?.low || stock?.regularMarketDayLow || stock?.price || 0),
    volume: stock?.volume || stock?.regularMarketVolume || 0,
    close: Number(stock?.close || stock?.price || stock?.regularMarketPrice || 0),
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
      console.log('Successfully loaded fundamentals data', {
        hasFiscalData: !!data.fiscalData,
        fiscalDataKeys: data.fiscalData ? Object.keys(data.fiscalData) : null,
        dataSource: data.dataSource
      });
    } catch (error) {
      console.error('Error fetching fundamentals:', error);
      setErrors(prev => ({ 
        ...prev, 
        fundamentals: `Failed to load fundamentals: ${error.message}` 
      }));
      setFundamentalsData(null);
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
    setActiveTab('overview');
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

  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Price charts, scores & investment thesis'
    },
    {
      id: 'financials',
      label: 'Financials',
      icon: Building,
      description: 'Balance sheet, income & cash flow'
    },
    {
      id: 'growth',
      label: 'Growth',
      icon: TrendingUp,
      description: 'Revenue & earnings growth analysis'
    },
    {
      id: 'valuation',
      label: 'Valuation',
      icon: Calculator,
      description: 'DCF, multiples & price targets'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Modal Header - Bloomberg Terminal Style */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{safeStock.symbol}</h2>
              <p className="text-gray-600 text-lg">{safeStock.name}</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  ${safeStock.price.toFixed(2)}
                </p>
                <div className={`flex items-center space-x-2 ${changeColor}`}>
                  <ChangeIcon size={20} />
                  <span className="font-semibold text-lg">
                    {isPositiveChange ? '+' : ''}${safeStock.change.toFixed(2)} 
                    ({isPositiveChange ? '+' : ''}{safeStock.change_p.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>High:</span>
                  <span className="font-medium">${safeStock.high.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low:</span>
                  <span className="font-medium">${safeStock.low.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-medium">{Number(safeStock.volume).toLocaleString()}</span>
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

        {/* Bloomberg Terminal Style Tab Navigation */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group relative px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm'
                  }`}
                  title={tab.description}
                >
                  <IconComponent size={18} />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{tab.label}</span>
                    <span className={`text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {tab.description}
                    </span>
                  </div>
                  
                  {/* Active tab indicator */}
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full shadow-lg"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'overview' && (
            <div className="p-6">
              <OverviewTab 
                symbol={safeStock.symbol}
                safeStock={safeStock}
                historicalData={historicalData}
                loading={loading.historical}
                onPeriodChange={handlePeriodChange}
                selectedPeriod={selectedPeriod}
              />
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="p-6">
              <FundamentalsTab symbol={safeStock.symbol} />
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="p-6">
              <GrowthTab symbol={safeStock.symbol} />
            </div>
          )}

          {activeTab === 'valuation' && (
            <div className="p-6">
              <ValuationTab symbol={safeStock.symbol} />
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {(loading.historical || loading.fundamentals) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 font-medium text-lg">
                {loading.historical ? 'Loading price data...' : 'Loading fundamentals...'}
              </p>
              <p className="text-gray-500 text-sm">
                Fetching comprehensive analysis for {safeStock.symbol}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockModal;
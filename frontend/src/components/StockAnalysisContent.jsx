import React, { useState, useEffect } from 'react';
import { BarChart3, Calculator, TrendingUp, DollarSign, Mic, FileText, Activity, PieChart, Users, LineChart } from 'lucide-react';
import TimePeriodSelector from './TimePeriodSelector';
import StockPriceCharts from './stock/StockPriceCharts';
import FundamentalsCharts from './stock/FundamentalsCharts';
import OverviewTab from './stock/OverviewTab';
import FundamentalsTab from './stock/FundamentalsTab';
import GrowthTab from './stock/GrowthTab';
import ValuationTab from './stock/ValuationTab';
import EarningsTab from './stock/EarningsTab';
// NEW IMPORTS FOR TIME SERIES FINANCIAL STATEMENTS
import BalanceSheetTab from './research/BalanceSheetTab';
import IncomeStatementTab from './research/IncomeStatementTab';
import CashFlowTab from './research/CashFlowTab';
// NEW TAB IMPORTS
import MetricsTab from './stock/MetricsTab';
import AnalystTab from './stock/AnalystTab';
import DCFModelTab from './stock/DCFModelTab';
import { marketApi } from '../services/api';

/**
 * StockAnalysisContent - Reusable Bloomberg Terminal-grade Analysis Component
 * 
 * This component contains all the stock analysis functionality previously in StockModal.
 * Can be used both in modal view and full-page view to maintain consistency.
 * 
 * Props:
 * - stock: Stock data object with symbol, price, change data
 * - isFullPage: Boolean to adjust styling for full-page vs modal use
 * - className: Additional CSS classes for container
 */
const StockAnalysisContent = ({ stock, isFullPage = false, className = '' }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for fundamentals data in charts tab
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false);
  const [fundamentalsError, setFundamentalsError] = useState(null);

  // ✅ NEW: Enhanced state for live price data to fix header display
  const [livePrice, setLivePrice] = useState(null);

  /**
   * ✅ ENHANCED: Robust period-based price calculation for ALL timeframes
   * Fixes the issue where 1M/3M/6M/1Y/5Y periods show +0.00%
   */
  const calculateRobustPeriodPerformance = (data, period) => {
    if (!data || data.length === 0) {
      console.warn('⚠️ [ROBUST_CALC] No data provided for calculation');
      return null;
    }

    // Filter out null/undefined prices and sort by date
    const validData = data
      .filter(point => point && point.price && !isNaN(point.price) && point.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (validData.length < 2) {
      console.warn('⚠️ [ROBUST_CALC] Insufficient valid data points:', validData.length);
      return null;
    }

    const firstPoint = validData[0];
    const lastPoint = validData[validData.length - 1];

    console.log(`🔧 [ROBUST_CALC] Period: ${period}`);
    console.log(`📊 [ROBUST_CALC] Data points: ${validData.length} (filtered from ${data.length})`);
    console.log(`📅 [ROBUST_CALC] Date range: ${firstPoint.date} → ${lastPoint.date}`);
    console.log(`💰 [ROBUST_CALC] Price range: $${firstPoint.price.toFixed(2)} → $${lastPoint.price.toFixed(2)}`);

    // ✅ ENHANCED: Better baseline selection for different periods
    let baselinePrice = firstPoint.price;
    let calculationType = 'period_performance';

    // For longer periods, ensure we have meaningful price separation
    if (['1m', '3m', '6m', '1y', '5y'].includes(period)) {
      // Calculate the date range we should be looking at
      const periodDays = {
        '1m': 30,
        '3m': 90,
        '6m': 180,
        '1y': 365,
        '5y': 1825
      };

      const targetDays = periodDays[period] || 365;
      const currentDate = new Date();
      const targetDate = new Date(currentDate.getTime() - (targetDays * 24 * 60 * 60 * 1000));

      console.log(`🎯 [ROBUST_CALC] Target period: ${targetDays} days ago (${targetDate.toISOString().split('T')[0]})`);

      // Find the data point closest to our target date
      let bestBaselinePoint = firstPoint;
      let smallestDateDiff = Math.abs(new Date(firstPoint.date) - targetDate);

      for (const point of validData) {
        const dateDiff = Math.abs(new Date(point.date) - targetDate);
        if (dateDiff < smallestDateDiff) {
          smallestDateDiff = dateDiff;
          bestBaselinePoint = point;
        }
      }

      // Use the better baseline if it's different from first point
      if (bestBaselinePoint !== firstPoint) {
        baselinePrice = bestBaselinePoint.price;
        calculationType = `${period}_optimized`;
        console.log(`✅ [ROBUST_CALC] Using optimized baseline: ${bestBaselinePoint.date} ($${baselinePrice.toFixed(2)})`);
      }
    }

    // Special handling for intraday periods
    if (period === '1d' || period === '5d') {
      calculationType = 'intraday';
    }

    const currentPrice = lastPoint.price;
    
    // ✅ ENHANCED: Robust percentage calculation with validation
    if (baselinePrice <= 0) {
      console.error('❌ [ROBUST_CALC] Invalid baseline price:', baselinePrice);
      return null;
    }

    const changeDollar = currentPrice - baselinePrice;
    const changePercent = (changeDollar / baselinePrice) * 100;

    console.log(`💹 [ROBUST_CALC] Calculation details:`);
    console.log(`   Baseline: $${baselinePrice.toFixed(4)}`);
    console.log(`   Current:  $${currentPrice.toFixed(4)}`);
    console.log(`   Change:   $${changeDollar.toFixed(4)} (${changePercent.toFixed(4)}%)`);

    // ✅ ENHANCED: Validation checks
    if (Math.abs(changePercent) < 0.001) {
      console.warn(`⚠️ [ROBUST_CALC] Very small change detected (${changePercent.toFixed(6)}%) - possible data issue`);
      
      // Check if all prices in the dataset are identical
      const uniquePrices = new Set(validData.map(p => p.price));
      if (uniquePrices.size === 1) {
        console.error(`❌ [ROBUST_CALC] All prices identical - data quality issue!`);
        return null;
      }
    }

    return {
      price: currentPrice,
      change_p: changePercent,
      change: changeDollar,
      timestamp: lastPoint.date || new Date().toISOString(),
      dataSource: 'robust_calculation',
      calculationType,
      baselinePrice,
      baselineDate: firstPoint.date,
      periodDataPoints: validData.length,
      dataQuality: validData.length >= 10 ? 'good' : 'limited'
    };
  };

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (stock && stock.symbol) {
        try {
          setLoading(true);
          
          // FIXED: Use clean symbol format for backend API calls
          const cleanSymbol = stock.symbol.replace(/\.(US|NYSE|NASDAQ|AMEX)$/i, '').toUpperCase();
          console.log('🔧 FIXED: Fetching historical data for clean symbol:', cleanSymbol, 'Period:', selectedPeriod);
          
          const data = await marketApi.getHistory(cleanSymbol, selectedPeriod);
          console.log('📈 Historical data received:', {
            symbol: cleanSymbol,
            period: selectedPeriod,
            length: data?.length || 0,
            hasMA200: data?.some(d => d.ma200 !== null) || false,
            hasRSI: data?.some(d => d.rsi !== null) || false,
            hasVolume: data?.some(d => d.volume && d.volume > 0) || false,
            isIntraday: data?.some(d => d.isIntraday) || false,
            firstPoint: data?.[0],
            lastPoint: data?.[data?.length - 1]
          });
          
          setHistoricalData(data || []);

          // ✅ ENHANCED: Use robust calculation for ALL timeframes
          if (data && data.length > 0) {
            const robustPriceData = calculateRobustPeriodPerformance(data, selectedPeriod);
            
            if (robustPriceData) {
              console.log('💰 [LIVE_PRICE] Robust calculation successful:', {
                symbol: cleanSymbol,
                period: selectedPeriod,
                currentPrice: robustPriceData.price.toFixed(2),
                baselinePrice: robustPriceData.baselinePrice.toFixed(2),
                changePercent: robustPriceData.change_p.toFixed(2) + '%',
                changeDollar: robustPriceData.change.toFixed(2),
                calculationType: robustPriceData.calculationType,
                dataPoints: robustPriceData.periodDataPoints,
                dataQuality: robustPriceData.dataQuality
              });
              
              setLivePrice(robustPriceData);
            } else {
              console.warn('⚠️ [LIVE_PRICE] Robust calculation failed, using fallback');
              
              // ✅ FALLBACK: Use simple first/last calculation as backup
              const lastPoint = data[data.length - 1];
              const firstPoint = data[0];
              
              if (lastPoint && firstPoint && lastPoint.price && firstPoint.price) {
                const fallbackPrice = {
                  price: lastPoint.price,
                  change_p: ((lastPoint.price - firstPoint.price) / firstPoint.price) * 100,
                  change: lastPoint.price - firstPoint.price,
                  timestamp: lastPoint.date || new Date().toISOString(),
                  dataSource: 'fallback_calculation',
                  calculationType: 'simple_fallback',
                  baselinePrice: firstPoint.price,
                  periodDataPoints: data.length
                };
                
                console.log('🔄 [LIVE_PRICE] Using fallback calculation:', fallbackPrice);
                setLivePrice(fallbackPrice);
              } else {
                console.error('❌ [LIVE_PRICE] No valid price data available');
                setLivePrice(null);
              }
            }
          } else {
            console.warn('⚠️ [LIVE_PRICE] No historical data available');
            setLivePrice(null);
          }
          
        } catch (error) {
          console.error('❌ Error fetching history:', error);
          setHistoricalData([]);
          setLivePrice(null);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchHistoricalData();
  }, [stock, selectedPeriod]);

  // Fetch fundamentals data for charts tab
  useEffect(() => {
    const fetchFundamentalsForCharts = async () => {
      if (stock && stock.symbol && activeTab === 'charts') {
        try {
          setFundamentalsLoading(true);
          setFundamentalsError(null);
          
          const cleanSymbol = stock.symbol.replace(/\.(US|NYSE|NASDAQ|AMEX)$/i, '').toUpperCase();
          const data = await marketApi.getFundamentals(cleanSymbol);
          setFundamentalsData(data);
        } catch (err) {
          console.error('❌ Error fetching fundamentals for charts:', err);
          setFundamentalsError(err.message);
        } finally {
          setFundamentalsLoading(false);
        }
      }
    };
    
    fetchFundamentalsForCharts();
  }, [stock, activeTab]);

  if (!stock) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-gray-500">No stock data available</p>
      </div>
    );
  }

  // Create safe values for metrics (handle null, undefined, etc.)
  const cleanDisplaySymbol = stock.symbol.replace(/\.(US|NYSE|NASDAQ|AMEX)$/i, '').toUpperCase();
  
  // ✅ ENHANCED: Intelligent display value selection
  const getDisplayPrice = () => {
    if (livePrice && livePrice.price) {
      return livePrice.price;
    }
    return typeof stock.close === 'number' ? stock.close : 
           (typeof stock.price === 'number' ? stock.price : 0);
  };

  const getDisplayChangePercent = () => {
    if (livePrice && typeof livePrice.change_p === 'number') {
      return livePrice.change_p;
    }
    return typeof stock.change_p === 'number' ? stock.change_p : 
           (typeof stock.changePercent === 'number' ? stock.changePercent : 0);
  };

  const getDisplayChangeDollar = () => {
    if (livePrice && typeof livePrice.change === 'number') {
      return livePrice.change;
    }
    return stock.change || 0;
  };

  // ✅ ENHANCED: Better data source labeling
  const getDataSourceLabel = () => {
    if (!livePrice) return '';
    
    const labels = {
      'robust_calculation': '• Live Data (Enhanced)',
      'fallback_calculation': '• Live Data (Fallback)',
      'intraday': '• Live Data (Intraday)',
      '1m_optimized': '• Live Data (1M Performance)',
      '3m_optimized': '• Live Data (3M Performance)',
      '6m_optimized': '• Live Data (6M Performance)',
      '1y_optimized': '• Live Data (1Y Performance)',
      '5y_optimized': '• Live Data (5Y Performance)',
      'period_performance': '• Live Data (Period Performance)',
      'simple_fallback': '• Live Data (Simple)'
    };
    
    return labels[livePrice.calculationType] || '• Live Data (Updated)';
  };

  // ✅ ENHANCED: Data quality indicator
  const getDataQualityIndicator = () => {
    if (!livePrice) return '';
    
    if (livePrice.dataQuality === 'good') {
      return '✅';
    } else if (livePrice.dataQuality === 'limited') {
      return '⚠️';
    } else if (livePrice.dataSource === 'fallback_calculation') {
      return '🔄';
    }
    return '';
  };
  
  const safeStock = {
    symbol: cleanDisplaySymbol,
    close: getDisplayPrice(),
    change_p: getDisplayChangePercent(),
    change: getDisplayChangeDollar(),
    volume: stock.volume || 'N/A',
    low: stock.low || stock.close * 0.98 || 0,
    high: stock.high || stock.close * 1.02 || 0,
    previousClose: stock.previousClose || stock.close || 0
  };

  // FIXED: Period change handler that accepts period value string
  const handlePeriodChange = (periodValue) => {
    console.log('🔄 Period change requested:', selectedPeriod, '→', periodValue);
    setSelectedPeriod(periodValue);
  };

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: BarChart3,
      description: 'Investment analysis and company story'
    },
    {
      id: 'metrics',
      name: 'Metrics',
      icon: LineChart,
      description: 'Key valuation, profitability, and liquidity metrics'
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      icon: FileText,
      description: 'Assets, liabilities, and financial position'
    },
    {
      id: 'income',
      name: 'Income',
      icon: Activity,
      description: 'Revenue, expenses, and profitability'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow',
      icon: PieChart,
      description: 'Cash generation and capital allocation'
    },
    {
      id: 'analyst',
      name: 'Analyst',
      icon: Users,
      description: 'Price targets, ratings, and projections'
    },
    {
      id: 'earnings',
      name: 'Earnings',
      icon: Mic,
      description: 'NLP analysis of earnings transcripts'
    },
    {
      id: 'dcf-model',
      name: 'DCF Model',
      icon: Calculator,
      description: 'Detailed discounted cash flow analysis'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            symbol={cleanDisplaySymbol}
            safeStock={safeStock}
            historicalData={historicalData}
            loading={loading}
            onPeriodChange={handlePeriodChange}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'metrics':
        return <MetricsTab symbol={cleanDisplaySymbol} />;
      
      case 'balance-sheet':
        return <BalanceSheetTab symbol={cleanDisplaySymbol} />;
      
      case 'income':
        return <IncomeStatementTab symbol={cleanDisplaySymbol} />;
      
      case 'cash-flow':
        return <CashFlowTab symbol={cleanDisplaySymbol} />;
      
      case 'analyst':
        return <AnalystTab symbol={cleanDisplaySymbol} />;
      
      case 'earnings':
        return <EarningsTab symbol={cleanDisplaySymbol} />;
      
      case 'dcf-model':
        return <DCFModelTab symbol={cleanDisplaySymbol} />;
      
      default:
        return (
          <div className="flex items-center justify-center h-80">
            <p className="text-gray-500">Select a tab to view analysis</p>
          </div>
        );
    }
  };

  // Container classes - different for modal vs full page
  const containerClasses = isFullPage 
    ? `bg-white ${className}` 
    : `bg-white rounded-lg shadow-xl ${className}`;

  const headerClasses = isFullPage 
    ? "bg-white border-b border-gray-200" 
    : "sticky top-0 bg-white border-b border-gray-200 z-10";

  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">{safeStock.symbol}</h2>
              <div className="flex items-center gap-4">
                <p className="text-4xl font-bold text-gray-900">${Number(safeStock.close).toFixed(2)}</p>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-lg font-semibold ${
                    Number(safeStock.change_p) >= 0 
                      ? "text-green-700 bg-green-100" 
                      : "text-red-700 bg-red-100"
                  }`}>
                    <span>
                      {Number(safeStock.change_p) >= 0 ? "+" : ""}{Number(safeStock.change_p).toFixed(2)}%
                    </span>
                    <span className="text-sm">
                      (${Math.abs(Number(safeStock.change)).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Bloomberg Terminal-grade Analysis • Enhanced Period Calculation {getDataQualityIndicator()}
                {livePrice && (
                  <span className="ml-2 text-green-600">
                    {getDataSourceLabel()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative px-4 py-4 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={18} />
                    <span className="font-semibold">{tab.name}</span>
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                    {tab.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default StockAnalysisContent;

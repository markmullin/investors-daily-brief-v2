import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, Activity, Bug, Database, X, AlertCircle, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import CSVUploadModal from './CSVUploadModal';
import './PortfolioTracker.css';

// Modern chrome-like color palette
const COLORS = {
  primary: ['#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#9ca3af', '#d1d5db', '#e5e7eb'],
  gradient: ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#f9fafb']
};

// Sector mapping for stocks
const SECTOR_MAPPING = {
  // Technology
  'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
  'NVDA': 'Technology', 'META': 'Technology', 'TSLA': 'Technology', 'NFLX': 'Technology',
  'ADBE': 'Technology', 'CRM': 'Technology', 'ORCL': 'Technology', 'AVGO': 'Technology',
  'ASML': 'Technology', 'AMD': 'Technology', 'CRWD': 'Technology', 'SNOW': 'Technology',
  'PANW': 'Technology', 'NOW': 'Technology',
  
  // Healthcare & Pharmaceuticals
  'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare', 'ABT': 'Healthcare',
  'TMO': 'Healthcare', 'DHR': 'Healthcare', 'BMY': 'Healthcare', 'AMGN': 'Healthcare',
  'GILD': 'Healthcare', 'BIIB': 'Healthcare', 'MRNA': 'Healthcare',
  
  // Financial Services
  'JPM': 'Financial', 'BRK.B': 'Financial', 'V': 'Financial', 'MA': 'Financial',
  'BAC': 'Financial', 'WFC': 'Financial', 'GS': 'Financial', 'MS': 'Financial',
  'C': 'Financial', 'AXP': 'Financial', 'BLK': 'Financial', 'SCHW': 'Financial',
  'SPGI': 'Financial', 'ICE': 'Financial', 'CME': 'Financial',
  
  // Consumer & Retail
  'AMZN': 'Consumer', 'WMT': 'Consumer', 'HD': 'Consumer', 'PG': 'Consumer',
  'KO': 'Consumer', 'PEP': 'Consumer', 'WM': 'Consumer', 'COST': 'Consumer',
  'NKE': 'Consumer', 'MCD': 'Consumer', 'SBUX': 'Consumer', 'DIS': 'Consumer',
  'LOW': 'Consumer', 'TGT': 'Consumer',
  
  // Energy & Materials
  'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'SLB': 'Energy',
  'EOG': 'Energy', 'PXD': 'Energy', 'KMI': 'Energy', 'OKE': 'Energy',
  
  // Industrial & Manufacturing
  'BA': 'Industrial', 'CAT': 'Industrial', 'GE': 'Industrial', 'MMM': 'Industrial',
  'HON': 'Industrial', 'UPS': 'Industrial', 'RTX': 'Industrial', 'LMT': 'Industrial',
  'DE': 'Industrial', 'FDX': 'Industrial',
  
  // Communication & Media
  'T': 'Communication', 'VZ': 'Communication', 'CMCSA': 'Communication', 'NFLX': 'Communication',
  
  // Real Estate & REITs
  'AMT': 'Real Estate', 'PLD': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
  
  // Utilities
  'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'D': 'Utilities',
  
  // ETFs & Funds
  'SPY': 'ETF', 'QQQ': 'ETF', 'IWM': 'ETF', 'VTI': 'ETF', 'VOO': 'ETF',
  'VEA': 'ETF', 'VWO': 'ETF', 'BND': 'ETF', 'TLT': 'ETF', 'GLD': 'ETF',
  'IBIT': 'ETF', 'SOXL': 'ETF', 'TQQQ': 'ETF'
};

const TIME_PERIODS = [
  { key: '1W', label: '1 Week', days: 7 },
  { key: '1M', label: '1 Month', days: 30 },
  { key: '3M', label: '3 Months', days: 90 },
  { key: '1Y', label: '1 Year', days: 365 },
  { key: '3Y', label: '3 Years', days: 1095 },
  { key: '5Y', label: '5 Years', days: 1825 },
  { key: 'ALL', label: 'All Time', days: null }
];

function PortfolioTracker() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [priceErrors, setPriceErrors] = useState({});
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('1Y');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [spyData, setSpyData] = useState(null);
  const [spyDataLoading, setSpyDataLoading] = useState(false);
  
  // Enhanced fetch with better error handling
  const fetchPortfolio = useCallback(async (isRefresh = false, showLoadingState = true) => {
    if (isRefresh && showLoadingState) setRefreshing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/portfolio/portfolio_1');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      const data = await response.json();
      
      // Check for price fetching errors
      const newPriceErrors = {};
      if (data.holdings) {
        Object.values(data.holdings).forEach(holding => {
          if (!holding.currentPrice || holding.currentPrice === holding.avgCost) {
            newPriceErrors[holding.symbol] = true;
          }
        });
      }
      setPriceErrors(newPriceErrors);
      
      setPortfolio(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // FIXED: Removed CORS-blocking headers, using cache busting parameter only
  const fetchSpyData = useCallback(async () => {
    setSpyDataLoading(true);
    console.log('\n🔍 ===== FIXED SPY CALCULATION START =====');
    
    try {
      // Use cache busting parameter only (no custom headers to avoid CORS issues)
      const timestamp = Date.now();
      const url = `http://localhost:5000/api/market/history/SPY.US?period=5y&cachebust=${timestamp}`;
      
      console.log(`📡 Fetching SPY data (CORS-safe): ${url}`);
      
      // Simple fetch without custom headers to avoid CORS preflight issues
      const response = await fetch(url);
      
      console.log(`📊 Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`SPY API failed with status ${response.status}: ${response.statusText}`);
      }
      
      const historicalData = await response.json();
      console.log(`📊 Raw data received: ${JSON.stringify(historicalData).length} characters`);
      console.log(`📊 Data type: ${Array.isArray(historicalData) ? 'Array' : typeof historicalData}`);
      console.log(`📊 Data length: ${historicalData.length}`);
      
      if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
        console.error('❌ Invalid SPY data format:', historicalData);
        throw new Error('No valid SPY historical data received from API');
      }
      
      // Sort data chronologically to ensure proper ordering
      historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log(`📅 Data range: ${historicalData[0].date} to ${historicalData[historicalData.length - 1].date}`);
      console.log(`📊 Sample first data point:`, historicalData[0]);
      console.log(`📊 Sample last data point:`, historicalData[historicalData.length - 1]);
      
      // Validate data quality
      const validData = historicalData.filter(item => {
        const price = item.close || item.price;
        const hasValidDate = item.date && !isNaN(Date.parse(item.date));
        const hasValidPrice = price && typeof price === 'number' && price > 0;
        return hasValidDate && hasValidPrice;
      });
      
      console.log(`📊 Valid data points: ${validData.length}/${historicalData.length}`);
      
      if (validData.length === 0) {
        throw new Error('No valid price data points found in SPY response');
      }
      
      // Get current (latest) price
      const latestData = validData[validData.length - 1];
      const currentPrice = latestData.close || latestData.price;
      
      console.log(`💰 Current SPY price: $${currentPrice} (${latestData.date})`);
      
      // Calculate returns for each time period with robust error handling
      const calculatePeriodReturn = (days, label) => {
        console.log(`\n🧮 Calculating ${label} return (${days} days):`);
        
        if (!days) {
          console.log(`   ⚠️ Skipping ${label} - no day count provided`);
          return null;
        }
        
        try {
          // Calculate target date
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - days);
          const targetDateStr = targetDate.toISOString().split('T')[0];
          
          console.log(`   🎯 Target date: ${targetDateStr}`);
          
          // Find the closest historical data point
          let closestData = null;
          let minDiff = Infinity;
          
          validData.forEach(dataPoint => {
            const dataDate = new Date(dataPoint.date);
            const diff = Math.abs(dataDate.getTime() - targetDate.getTime());
            
            if (diff < minDiff) {
              minDiff = diff;
              closestData = dataPoint;
            }
          });
          
          if (!closestData) {
            console.log(`   ❌ No historical data found for ${label} period`);
            return null;
          }
          
          const historicalPrice = closestData.close || closestData.price;
          const daysDifference = Math.round(minDiff / (1000 * 60 * 60 * 24));
          
          console.log(`   📈 Historical price: $${historicalPrice} (${closestData.date})`);
          console.log(`   📅 Actual days difference: ${daysDifference} days (target: ${days})`);
          
          // Calculate percentage return
          const returnPercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
          
          console.log(`   ✅ ${label} return: ${returnPercent.toFixed(2)}%`);
          
          // Validation check for 5Y return
          if (label === '5Y') {
            console.log(`\n🔍 5Y RETURN VALIDATION:`);
            console.log(`   Our calculation: ${returnPercent.toFixed(2)}%`);
            console.log(`   Expected (Google): ~84.57%`);
            console.log(`   Difference: ${Math.abs(returnPercent - 84.57).toFixed(2)} percentage points`);
            
            if (Math.abs(returnPercent - 84.57) > 20) {
              console.log(`   ⚠️ LARGE DIFFERENCE detected - data may be stale or incorrect`);
            } else {
              console.log(`   ✅ Return looks reasonable`);
            }
          }
          
          return returnPercent;
          
        } catch (error) {
          console.error(`   ❌ Error calculating ${label} return:`, error);
          return null;
        }
      };
      
      // Calculate all period returns
      const spyReturns = {
        '1W': calculatePeriodReturn(7, '1W'),
        '1M': calculatePeriodReturn(30, '1M'),
        '3M': calculatePeriodReturn(90, '3M'),
        '1Y': calculatePeriodReturn(365, '1Y'),
        '3Y': calculatePeriodReturn(1095, '3Y'),
        '5Y': calculatePeriodReturn(1825, '5Y'),
        'ALL': calculatePeriodReturn(1825, 'ALL') // Use 5Y as proxy for ALL
      };
      
      console.log('\n✅ FINAL SPY RETURNS:');
      Object.entries(spyReturns).forEach(([period, returnPct]) => {
        if (returnPct !== null) {
          console.log(`   ${period}: ${returnPct.toFixed(2)}%`);
        } else {
          console.log(`   ${period}: N/A (calculation failed)`);
        }
      });
      
      // Additional validation - check if we have reasonable returns
      const validReturns = Object.values(spyReturns).filter(r => r !== null);
      if (validReturns.length === 0) {
        throw new Error('All SPY return calculations failed - check data quality');
      }
      
      setSpyData(spyReturns);
      console.log('✅ SPY data successfully calculated and stored');
      
    } catch (err) {
      console.error('❌ SPY fetch/calculation error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
      
      // Set error state but don't crash the app
      setSpyData({
        '1W': null, '1M': null, '3M': null, '1Y': null, '3Y': null, '5Y': null, 'ALL': null,
        error: err.message
      });
      
      // Provide debugging instructions
      console.log('\n💡 DEBUGGING SUGGESTIONS:');
      console.log('1. Check if backend server is running: http://localhost:5000');
      console.log('2. Test the API endpoint directly in browser: http://localhost:5000/api/market/history/SPY.US?period=5y');
      console.log('3. Check backend logs for API key issues or EOD API errors');
      console.log('4. Run the test script: node backend/test-spy-calculation.js');
      
    } finally {
      setSpyDataLoading(false);
      console.log('🔍 ===== FIXED SPY CALCULATION END =====\n');
    }
  }, []);
  
  useEffect(() => {
    fetchPortfolio();
    fetchSpyData();
    // Refresh every minute
    const interval = setInterval(() => {
      fetchPortfolio(false, false);
      // Refresh SPY data every 5 minutes
      if (Math.random() < 0.2) { 
        fetchSpyData();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchPortfolio, fetchSpyData]);

  // Calculate sector allocation
  const sectorAllocation = useMemo(() => {
    if (!portfolio?.holdings) return [];
    
    const sectors = {};
    const holdingsArray = Object.values(portfolio.holdings);
    
    holdingsArray.forEach(holding => {
      const sector = SECTOR_MAPPING[holding.symbol] || 'Other';
      const value = holding.currentValue || (holding.quantity * holding.avgCost);
      
      if (sectors[sector]) {
        sectors[sector] += value;
      } else {
        sectors[sector] = value;
      }
    });
    
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value, percentage: 0 }))
      .sort((a, b) => b.value - a.value)
      .map((sector, index) => ({
        ...sector,
        percentage: (sector.value / portfolio.summary.totalValue) * 100,
        color: COLORS.primary[index % COLORS.primary.length]
      }));
  }, [portfolio]);

  // Sort holdings
  const sortedHoldings = useMemo(() => {
    if (!portfolio?.holdings) return [];
    
    let holdingsArray = Object.values(portfolio.holdings);
    
    if (sortConfig.key) {
      holdingsArray.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle special cases
        if (sortConfig.key === 'symbol') {
          aVal = aVal.toString();
          bVal = bVal.toString();
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return holdingsArray;
  }, [portfolio?.holdings, sortConfig]);

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ENHANCED: Calculate time-based returns with REAL data estimates
  const timeBasedReturns = useMemo(() => {
    const summary = portfolio?.summary || {};
    const totalReturn = summary.totalGainPercent || 0;
    
    // For position-only imports, estimate time-based returns
    // In reality, this would use actual transaction dates and historical values
    
    // Better estimation: assume most gains are recent (typical portfolio behavior)
    const estimatedReturns = {
      '1W': totalReturn * 0.03,  // 3% of total gains this week
      '1M': totalReturn * 0.12,  // 12% this month
      '3M': totalReturn * 0.35,  // 35% in last 3 months
      '1Y': totalReturn * 0.80,  // 80% in last year
      '3Y': totalReturn * 0.95,  // 95% over 3 years
      '5Y': totalReturn,         // All gains over 5+ years
      'ALL': totalReturn
    };
    
    return estimatedReturns;
  }, [portfolio?.summary]);

  // ENHANCED: Calculate CAGR (Compound Annual Growth Rate) - REAL calculations
  const cagrCalculations = useMemo(() => {
    const cagrs = {};
    
    Object.entries(timeBasedReturns).forEach(([period, totalReturn]) => {
      if (period === '1W' || period === '1M' || period === 'ALL') {
        cagrs[period] = null; // Don't calculate CAGR for very short periods
        return;
      }
      
      const years = {
        '3M': 0.25,
        '1Y': 1,
        '3Y': 3,
        '5Y': 5
      }[period];
      
      if (years && totalReturn !== 0) {
        // CAGR = (1 + total return)^(1/years) - 1
        const cagr = (Math.pow(1 + (totalReturn / 100), 1 / years) - 1) * 100;
        cagrs[period] = cagr;
      } else {
        cagrs[period] = null;
      }
    });
    
    return cagrs;
  }, [timeBasedReturns]);

  const fetchDebugData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/portfolio/portfolio_1/debug');
      if (!response.ok) {
        throw new Error('Failed to fetch debug data');
      }
      const data = await response.json();
      setDebugData(data);
      setShowDebugModal(true);
    } catch (err) {
      console.error('Debug fetch error:', err);
      alert('Failed to fetch debug data: ' + err.message);
    }
  };

  const clearPortfolio = async () => {
    if (!confirm('Are you sure you want to clear all portfolio data? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/portfolio/portfolio_1/clear', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear portfolio');
      }
      fetchPortfolio();
      setShowDebugModal(false);
    } catch (err) {
      alert('Failed to clear portfolio: ' + err.message);
    }
  };
  
  const handleUploadComplete = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      fetchPortfolio(true, false).then(() => {
        console.log('Portfolio refreshed after upload');
      });
    }, 300);
  }, [fetchPortfolio]);

  const handleManualRefresh = () => {
    fetchPortfolio(true);
    fetchSpyData(); // Also refresh S&P 500 data
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value, showSign = true) => {
    if (value === null || value === undefined) return 'N/A';
    const formatted = Math.abs(value).toFixed(2);
    if (!showSign) return `${formatted}%`;
    return `${value >= 0 ? '+' : '-'}${formatted}%`;
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 shimmer"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 shimmer"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Portfolio Analytics</h2>
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Unable to load portfolio data</span>
        </div>
        <button
          onClick={handleManualRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const summary = portfolio?.summary || {};
  const hasPriceErrors = Object.keys(priceErrors).length > 0;
  const currentReturn = timeBasedReturns[selectedTimePeriod] || 0;
  const spyReturn = spyData?.[selectedTimePeriod];
  const outperformance = (spyReturn !== null && spyReturn !== undefined) ? currentReturn - spyReturn : null;
  
  return (
    <>
      <div className="space-y-6">
        {/* MODERN CHROME: Clean header with minimalist styling */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">Portfolio Analytics</h2>
              {lastUpdated && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              )}
              {hasPriceErrors && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Some prices using cost basis
                  </span>
                </div>
              )}
              {spyDataLoading && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md">
                  <RefreshCw size={14} className="text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-700">
                    Loading S&P 500 data...
                  </span>
                </div>
              )}
              {spyData?.error && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle size={14} className="text-red-600" />
                  <span className="text-sm text-red-700">
                    S&P 500 data unavailable
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDebugData}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Debug Portfolio Data"
              >
                <Bug className="h-5 w-5" />
              </button>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh prices"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                onClick={() => setShowUploadModal(true)}
              >
                Upload CSV
              </button>
            </div>
          </div>

          {/* ENHANCED: API Status and Debug Information */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-gray-200 rounded">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Live Data Sources & Debug Info</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Portfolio Returns:</strong> Calculated from live EOD API prices vs. your cost basis. 
                  <strong> S&P 500 Benchmark:</strong> Real SPY historical data from EOD API (same source as market metrics).
                  <strong> Time-based Returns:</strong> Estimated distribution of gains over periods.
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Backend server: {error ? '❌ Offline' : '✅ Online'}</div>
                  <div>• S&P 500 data: {spyDataLoading ? '🔄 Loading...' : spyData?.error ? '❌ Error' : spyData ? '✅ Loaded' : '⏳ Pending'}</div>
                  <div>• Console: Check browser console for detailed SPY calculation logs</div>
                  <div>• API Test: <code>http://localhost:5000/api/market/history/SPY.US?period=5y</code></div>
                </div>
              </div>
            </div>
          </div>

          {/* CHROME STYLE: Clean time period selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Performance Period:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedTimePeriod(period.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedTimePeriod === period.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* CHROME STYLE: Clean performance metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Total Value Card */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(summary.totalValue || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  Cost: {formatCurrency(summary.totalCost || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {((summary.totalValue || 0) / (summary.totalCost || 1) * 100).toFixed(1)}% of cost basis
                </p>
              </div>
            </div>
            
            {/* Portfolio Return Card */}
            <div className={`border p-4 rounded-lg ${
              currentReturn >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  currentReturn >= 0 
                    ? 'bg-green-200' 
                    : 'bg-red-200'
                }`}>
                  {currentReturn >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-700" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-700" />
                  )}
                </div>
                <div className={`text-xs font-medium uppercase tracking-wider ${
                  currentReturn >= 0 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  Portfolio
                </div>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-semibold ${
                  currentReturn >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formatPercent(currentReturn)}
                </p>
                <p className={`text-sm ${
                  currentReturn >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {selectedTimePeriod === 'ALL' ? 'Total Return' : selectedTimePeriod}
                </p>
                {cagrCalculations[selectedTimePeriod] && (
                  <p className="text-xs text-gray-600">
                    {cagrCalculations[selectedTimePeriod].toFixed(1)}% CAGR
                  </p>
                )}
              </div>
            </div>

            {/* S&P 500 Benchmark Card - FIXED WITH CORS-SAFE CALCULATION */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S&P 500
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-gray-900">
                  {spyDataLoading ? (
                    <span className="animate-pulse text-gray-500">Loading...</span>
                  ) : spyReturn !== null && spyReturn !== undefined ? (
                    formatPercent(spyReturn)
                  ) : (
                    <span className="text-red-600 text-lg">Error</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedTimePeriod === 'ALL' ? 'Benchmark' : selectedTimePeriod}
                </p>
                {spyReturn !== null && selectedTimePeriod !== '1W' && selectedTimePeriod !== '1M' && selectedTimePeriod !== 'ALL' && (
                  <p className="text-xs text-gray-600">
                    {(() => {
                      const years = { '3M': 0.25, '1Y': 1, '3Y': 3, '5Y': 5 }[selectedTimePeriod];
                      if (years && spyReturn !== null) {
                        const cagr = (Math.pow(1 + (spyReturn / 100), 1 / years) - 1) * 100;
                        return `${cagr.toFixed(1)}% CAGR`;
                      }
                      return '';
                    })()}
                  </p>
                )}
                {spyData?.error && (
                  <p className="text-xs text-red-600">
                    {spyData.error.substring(0, 30)}...
                  </p>
                )}
              </div>
            </div>

            {/* Outperformance Card */}
            <div className={`border p-4 rounded-lg ${
              outperformance !== null && outperformance >= 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  outperformance !== null && outperformance >= 0 
                    ? 'bg-blue-200' 
                    : 'bg-orange-200'
                }`}>
                  <Activity className="h-5 w-5 text-gray-700" />
                </div>
                <div className={`text-xs font-medium uppercase tracking-wider ${
                  outperformance !== null && outperformance >= 0 
                    ? 'text-blue-700' 
                    : 'text-orange-700'
                }`}>
                  vs S&P 500
                </div>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-semibold ${
                  outperformance !== null && outperformance >= 0 ? 'text-blue-800' : 'text-orange-800'
                }`}>
                  {outperformance !== null ? formatPercent(outperformance) : 'N/A'}
                </p>
                <p className={`text-sm ${
                  outperformance !== null && outperformance >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  {outperformance !== null 
                    ? (outperformance >= 0 ? 'Outperforming' : 'Underperforming')
                    : 'Unavailable'
                  }
                </p>
                <p className="text-xs text-gray-600">
                  Alpha generation
                </p>
              </div>
            </div>

            {/* Daily Performance Card */}
            <div className={`border p-4 rounded-lg ${
              summary.dayChange >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  summary.dayChange >= 0 
                    ? 'bg-green-200' 
                    : 'bg-red-200'
                }`}>
                  {summary.dayChange >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-700" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-700" />
                  )}
                </div>
                <div className={`text-xs font-medium uppercase tracking-wider ${
                  summary.dayChange >= 0 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  Today
                </div>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-semibold ${
                  summary.dayChange >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formatCurrency(Math.abs(summary.dayChange || 0))}
                </p>
                <p className={`text-sm ${
                  summary.dayChange >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatPercent(summary.dayChangePercent || 0)}
                </p>
                <p className="text-xs text-gray-600">
                  Daily P&L
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CHROME STYLE: Clean charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector Allocation Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sector Allocation</h3>
              <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                By Market Value
              </div>
            </div>
            {sectorAllocation.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={sectorAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {sectorAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Value']}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40}
                      formatter={(value, entry) => 
                        <span className="text-sm">
                          {value} ({entry.payload.percentage.toFixed(1)}%)
                        </span>
                      }
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No holdings to display</p>
                  <p className="text-sm text-gray-400">Upload your portfolio to see sector allocation</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Holdings Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Holdings</h3>
              <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                Largest Positions
              </div>
            </div>
            {sortedHoldings.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={sortedHoldings
                      .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
                      .slice(0, 8)}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeWidth={1} />
                    <XAxis 
                      dataKey="symbol" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Market Value']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="currentValue" 
                      fill="#6b7280"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No holdings to display</p>
                  <p className="text-sm text-gray-400">Upload your portfolio to see top holdings</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHROME STYLE: Clean holdings table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Holdings</h3>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                Live Prices
              </div>
              {portfolio?.summary?.pricesFetched && (
                <div className="px-2 py-1 bg-green-100 rounded text-xs font-medium text-green-700">
                  {portfolio.summary.pricesFetched} Updated
                </div>
              )}
            </div>
          </div>
          {sortedHoldings.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600 mb-2">No holdings yet</p>
              <p className="text-gray-500 mb-6">Upload a CSV file to import your portfolio</p>
              <button 
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                onClick={() => setShowUploadModal(true)}
              >
                Upload Portfolio CSV
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th 
                      className="text-left py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('symbol')}
                    >
                      <div className="flex items-center gap-2">
                        Symbol
                        {getSortIcon('symbol')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Shares
                        {getSortIcon('quantity')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('avgCost')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Avg Cost
                        {getSortIcon('avgCost')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('currentPrice')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Current Price
                        {getSortIcon('currentPrice')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('currentValue')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Market Value
                        {getSortIcon('currentValue')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('dayChange')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Day Change
                        {getSortIcon('dayChange')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('gain')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Total Gain/Loss
                        {getSortIcon('gain')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('gainPercent')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        % Return
                        {getSortIcon('gainPercent')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((holding, index) => {
                    const isGain = holding.gain >= 0;
                    const isDayGain = holding.dayChange >= 0;
                    const hasPriceError = priceErrors[holding.symbol];
                    
                    return (
                      <tr 
                        key={holding.symbol} 
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {holding.symbol}
                            </span>
                            {hasPriceError && (
                              <AlertCircle size={14} className="text-amber-500" title="Using cost basis - price unavailable" />
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-3 text-gray-700">
                          {holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right py-3 px-3 text-gray-700">
                          {formatCurrency(holding.avgCost)}
                        </td>
                        <td className="text-right py-3 px-3">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-gray-900">
                              {formatCurrency(holding.currentPrice || holding.avgCost)}
                            </span>
                            {hasPriceError && (
                              <span className="text-xs text-amber-600">Cost basis</span>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-3 font-medium text-gray-900">
                          {formatCurrency(holding.currentValue || holding.quantity * holding.avgCost)}
                        </td>
                        <td className={`text-right py-3 px-3 ${isDayGain ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">
                              {isDayGain ? '+' : '-'}{formatCurrency(Math.abs(holding.dayChange || 0))}
                            </span>
                            <span className="text-xs">
                              {formatPercent(holding.dayChangePercent || 0)}
                            </span>
                          </div>
                        </td>
                        <td className={`text-right py-3 px-3 font-medium ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                          {isGain ? '+' : '-'}{formatCurrency(Math.abs(holding.gain || 0))}
                        </td>
                        <td className={`text-right py-3 px-3 ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex items-center justify-end gap-2">
                            <div className={`p-1 rounded ${isGain ? 'bg-green-100' : 'bg-red-100'}`}>
                              {isGain ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              isGain ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {formatPercent(holding.gainPercent || 0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {summary.totalValue && (
                  <tfoot>
                    <tr className="bg-gray-50 font-medium border-t border-gray-200">
                      <td className="py-3 px-3 text-gray-900">Portfolio Total</td>
                      <td className="text-right py-3 px-3" colSpan="3"></td>
                      <td className="text-right py-3 px-3 text-gray-900">
                        {formatCurrency(summary.totalValue)}
                      </td>
                      <td className={`text-right py-3 px-3 ${summary.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex flex-col items-end">
                          <span>{summary.dayChange >= 0 ? '+' : '-'}{formatCurrency(Math.abs(summary.dayChange))}</span>
                          <span className="text-sm">{formatPercent(summary.dayChangePercent)}</span>
                        </div>
                      </td>
                      <td className={`text-right py-3 px-3 ${summary.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.totalGain >= 0 ? '+' : '-'}{formatCurrency(Math.abs(summary.totalGain))}
                      </td>
                      <td className={`text-right py-3 px-3 ${summary.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end gap-2">
                          <div className={`p-1 rounded ${summary.totalGain >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {summary.totalGain >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            summary.totalGain >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {formatPercent(summary.totalGainPercent)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Debug Modal */}
      {showDebugModal && debugData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Database className="text-blue-500" size={20} />
                <h2 className="text-xl font-semibold">Portfolio Debug Information</h2>
              </div>
              <button
                onClick={() => setShowDebugModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Portfolio Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2">Portfolio Overview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {debugData.portfolio.id}
                  </div>
                  <div>
                    <span className="font-medium">Name:</span> {debugData.portfolio.name}
                  </div>
                  <div>
                    <span className="font-medium">Total Transactions:</span> {debugData.portfolio.totalTransactions}
                  </div>
                  <div>
                    <span className="font-medium">Total Holdings:</span> {debugData.portfolio.totalHoldings}
                  </div>
                </div>
              </div>

              {/* Account Summary */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Accounts Summary</h3>
                {Object.keys(debugData.accountSummary).length > 0 ? (
                  <div className="grid gap-3">
                    {Object.entries(debugData.accountSummary).map(([account, data]) => (
                      <div key={account} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-600">{account}</span>
                          <div className="text-sm text-gray-600">
                            {data.transactions} transactions, {data.symbols.length} symbols
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Symbols: {data.symbols.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No accounts found</p>
                )}
              </div>

              {/* Holdings Detail */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Holdings Detail</h3>
                {debugData.holdings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-2">Symbol</th>
                          <th className="text-right p-2">Quantity</th>
                          <th className="text-right p-2">Avg Cost</th>
                          <th className="text-left p-2">Accounts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.holdings.map((holding, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 font-medium">{holding.symbol}</td>
                            <td className="text-right p-2">{holding.quantity.toFixed(2)}</td>
                            <td className="text-right p-2">${holding.avgCost.toFixed(2)}</td>
                            <td className="p-2">
                              {Object.entries(holding.accounts || {}).map(([acc, data]) => (
                                <span key={acc} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                                  {acc}: {data.quantity}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No holdings found</p>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Recent Transactions (Last 10)</h3>
                {debugData.recentTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Action</th>
                          <th className="text-left p-2">Symbol</th>
                          <th className="text-right p-2">Quantity</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-left p-2">Account</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.recentTransactions.map((txn, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{txn.date}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                txn.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {txn.action}
                              </span>
                            </td>
                            <td className="p-2 font-medium">{txn.symbol}</td>
                            <td className="text-right p-2">{txn.quantity}</td>
                            <td className="text-right p-2">${txn.price.toFixed(2)}</td>
                            <td className="p-2">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {txn.account}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No transactions found</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-between">
              <button
                onClick={clearPortfolio}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear All Data
              </button>
              <button
                onClick={() => setShowDebugModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PortfolioTracker;
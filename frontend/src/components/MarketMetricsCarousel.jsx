import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Info, TrendingUp, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Area, ComposedChart, BarChart, Bar, Cell
} from 'recharts';
import InfoTooltip from './InfoTooltip';
import TimePeriodSelector from './TimePeriodSelector';
import { useViewMode } from '../context/ViewModeContext';
import { validateData } from '../utils/ChartDataManager';
import { marketApi, cacheUtils } from '../services/api';

/**
 * Calculate dynamic return percentage based on selected timeframe
 */
const calculateTimeframeReturn = (chartData, period) => {
  console.log(`🔍 calculateTimeframeReturn called for ${period}:`, {
    dataLength: chartData?.length || 0,
    period
  });

  if (!chartData || chartData.length < 2) {
    console.warn(`⚠️ Insufficient data for ${period}: ${chartData?.length || 0} points`);
    return null;
  }

  // 🚀 FIXED: Sort by date and ensure proper ordering
  const validPrices = chartData
    .filter(item => {
      const hasValidPrice = item.price && item.price > 0;
      const hasValidDate = item.date;
      return hasValidPrice && hasValidDate;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // CRITICAL: Sort by date

  if (validPrices.length < 2) {
    console.warn(`⚠️ Insufficient valid prices for ${period}: ${validPrices.length} points`);
    return null;
  }

  const firstPrice = validPrices[0].price;
  const lastPrice = validPrices[validPrices.length - 1].price;
  const firstDate = validPrices[0].date;
  const lastDate = validPrices[validPrices.length - 1].date;
  
  if (!firstPrice || !lastPrice || firstPrice <= 0) {
    console.warn(`⚠️ Invalid prices for ${period}:`, { firstPrice, lastPrice });
    return null;
  }

  const returnPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  console.log(`📊 ${period} return calculation DETAILED:`, {
    firstDate,
    lastDate,
    firstPrice: firstPrice.toFixed(2),
    lastPrice: lastPrice.toFixed(2),
    returnPercent: returnPercent.toFixed(2) + '%',
    dataPoints: validPrices.length,
    periodCheck: period
  });
  
  // 🚨 CRITICAL: Validation checks
  const daysDiff = (new Date(lastDate) - new Date(firstDate)) / (1000 * 60 * 60 * 24);
  console.log(`📅 Date range for ${period}: ${Math.round(daysDiff)} days`);
  
  // Expected ranges for validation
  const expectedDays = {
    '1d': 0.5, '5d': 2, '1m': 20, '3m': 60, '6m': 150, '1y': 300, '5y': 1500
  };
  
  const minExpected = expectedDays[period] || 0;
  if (daysDiff < minExpected) {
    console.warn(`🚨 ${period} date range too short: ${Math.round(daysDiff)} days (expected: ${minExpected}+)`);
  }
  
  return returnPercent;
};

/**
 * Get return period label for display
 */
const getReturnPeriodLabel = (period) => {
  switch (period) {
    case '1d': return '1-Day';
    case '5d': return '5-Day';
    case '1m': return '1-Month';
    case '3m': return '3-Month';
    case '6m': return '6-Month';
    case '1y': return '1-Year';
    case '5y': return '5-Year';
    default: return 'Period';
  }
};

/**
 * Custom tooltip component for financial data
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{data.displayDate || (data.date ? new Date(data.date).toLocaleDateString() : '')}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <p className="text-gray-600">Price:</p>
          <p className="font-semibold">${Number(data.price || data.close).toFixed(2)}</p>
          
          {data.volume !== undefined && data.volume !== null && (
            <>
              <p className="text-gray-600">Volume:</p>
              <p className="font-semibold">{Number(data.volume).toLocaleString()}</p>
            </>
          )}
          
          {data.priceChange !== undefined && data.priceChange !== null && (
            <>
              <p className="text-gray-600">Change:</p>
              <p className={`font-semibold ${data.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.priceChange >= 0 ? '+' : ''}{data.priceChange.toFixed(2)}%
              </p>
            </>
          )}
          
          {data.ma200 !== undefined && data.ma200 !== null && (
            <>
              <p className="text-gray-600">MA 200:</p>
              <p className="font-semibold">${Number(data.ma200).toFixed(2)}</p>
            </>
          )}
          
          {data.rsi !== undefined && data.rsi !== null && (
            <>
              <p className="text-gray-600">RSI:</p>
              <p className={`font-semibold ${
                Number(data.rsi) >= 70 ? 'text-red-500' : (Number(data.rsi) <= 30 ? 'text-green-500' : 'text-gray-700')
              }`}>
                {Number(data.rsi).toFixed(1)}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom bar shape for volume bars with color based on price change - MUCH MORE SUBTLE
const CustomBar = (props) => {
  const { fill, x, y, width, height, payload } = props;
  const barColor = payload.priceChange >= 0 ? '#22c55e' : '#ef4444';
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={barColor}
      opacity={0.15} // REDUCED from 0.4 to 0.15 - much more subtle
    />
  );
};

/**
 * Market Metrics Carousel Component - FIXED: Remove .US suffix since backend handles it
 */
const MarketMetricsCarousel = ({ indices, historicalData: initialHistoricalData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [historicalData, setHistoricalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { viewMode } = useViewMode();

  // Reference for desired index order
  const desiredOrder = ['SPY', 'QQQ', 'IWM', 'DIA'];
  
  // Sort indices according to desiredOrder
  const orderedIndices = [...indices].sort((a, b) => {
    const aIndex = desiredOrder.indexOf(a.symbol);
    const bIndex = desiredOrder.indexOf(b.symbol);
    return (aIndex > -1 ? aIndex : 999) - (bIndex > -1 ? bIndex : 999);
  });
  
  // 🚀 FIXED: Use clean symbol without .US suffix - backend FMP service handles this automatically
  const currentIndex_ = orderedIndices[currentIndex];
  const currentSymbol = currentIndex_?.symbol;
  
  // Navigation functions
  const goNext = () => {
    setCurrentIndex((prev) => (prev === orderedIndices.length - 1 ? 0 : prev + 1));
  };
  
  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? orderedIndices.length - 1 : prev - 1));
  };
  
  // Display name formatting
  const getDisplayName = (rawSymbol) => {
    const shortSymbol = rawSymbol?.replace('.US', '') || '';
    switch (shortSymbol) {
      case 'SPY': return 'S&P 500';
      case 'QQQ': return 'Nasdaq 100';
      case 'DIA': return 'Dow Jones';
      case 'IWM': return 'Russell 2000';
      default: return rawSymbol || 'Market Index';
    }
  };
  
  const currentData = orderedIndices[currentIndex] || {};
  
  // 🚀 FIXED: Fetch new data when period changes - no more .US suffix, no more clearHistory error
  useEffect(() => {
    const fetchPeriodData = async () => {
      if (!currentSymbol) return;
      
      console.log(`🚀 PERIOD CHANGE DETECTED: Fetching ${currentSymbol} for ${selectedPeriod}`);
      setIsLoading(true);
      
      try {
        // Force fresh API call by adding timestamp
        const timestamp = Date.now();
        const data = await marketApi.getHistory(currentSymbol, selectedPeriod, { 
          timestamp,
          forceRefresh: true 
        });
        
        console.log(`📊 FRESH API DATA for ${currentSymbol} ${selectedPeriod}:`, {
          dataLength: data?.length || 0,
          sampleDates: data?.slice(0, 3)?.map(d => d.date) || [],
          lastDates: data?.slice(-3)?.map(d => d.date) || []
        });
        
        // 🚀 ENHANCED: Validate data with MUCH MORE LENIENT ranges for trading days
        if (data && data.length > 0) {
          const firstDate = new Date(data[0]?.date);
          const lastDate = new Date(data[data.length - 1]?.date);
          const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
          
          // 🚀 FIXED: Very lenient expected ranges to accommodate backend fixes
          const expectedRanges = {
            '1d': { min: 0.2, max: 5 },
            '5d': { min: 2, max: 15 },
            '1m': { min: 15, max: 50 },
            '3m': { min: 50, max: 150 },
            '6m': { min: 120, max: 250 },
            '1y': { min: 180, max: 500 }, // 🚀 FIXED: Much more lenient 180-500 days for 1Y
            '5y': { min: 1000, max: 2500 } // 🚀 FIXED: Accept very wide range for 5Y
          };
          
          const range = expectedRanges[selectedPeriod];
          if (range && (daysDiff < range.min || daysDiff > range.max)) {
            console.warn(`⚠️ DATA OUTSIDE EXPECTED RANGE for ${selectedPeriod}:`, {
              expectedDays: `${range.min}-${range.max}`,
              actualDays: Math.round(daysDiff),
              dataPoints: data.length,
              firstDate: data[0]?.date,
              lastDate: data[data.length - 1]?.date
            });
            
            // 🚀 ENHANCED: Only reject if EXTREMELY out of range (more than 5x expected)
            const severity = Math.abs(daysDiff - ((range.min + range.max) / 2)) / ((range.max - range.min) / 2);
            if (severity > 5) { // Only reject if more than 5x out of expected range
              console.error(`🚨 EXTREMELY INVALID DATA - rejecting (severity: ${severity.toFixed(1)}x)`);
              setHistoricalData(prev => ({
                ...prev,
                [currentSymbol]: { 
                  data: [], 
                  period: selectedPeriod,
                  error: `Extremely invalid data range: ${Math.round(daysDiff)} days (expected: ${range.min}-${range.max})`
                }
              }));
              return;
            } else {
              console.warn(`⚠️ Data out of expected range but acceptable (severity: ${severity.toFixed(1)}x): ${Math.round(daysDiff)} days`);
            }
          } else {
            console.log(`✅ Data range validation PASSED for ${selectedPeriod}: ${Math.round(daysDiff)} days`);
          }
        }
        
        // Store the fresh data with validation
        setHistoricalData(prev => ({
          ...prev,
          [currentSymbol]: { 
            data, 
            period: selectedPeriod,
            timestamp: Date.now(),
            validated: true
          }
        }));
        
        console.log(`✅ SUCCESSFULLY STORED ${selectedPeriod} data: ${data?.length || 0} points`);
        
      } catch (error) {
        console.error(`❌ Error fetching ${selectedPeriod} data for ${currentSymbol}:`, error);
        setHistoricalData(prev => ({
          ...prev,
          [currentSymbol]: { 
            data: [], 
            period: selectedPeriod,
            error: error.message
          }
        }));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriodData();
  }, [currentSymbol, selectedPeriod]);
  
  // 🚀 FIXED: Enhanced chartData with clean symbol (no .US suffix)
  const chartData = useMemo(() => {
    console.log(`🔄 RECOMPUTING CHART DATA for ${currentSymbol} period ${selectedPeriod}`);
    
    // Get the historical entry using clean symbol
    const historicalEntry = historicalData[currentSymbol];
    
    console.log(`📊 Historical entry debug:`, {
      hasEntry: !!historicalEntry,
      entryPeriod: historicalEntry?.period,
      selectedPeriod: selectedPeriod,
      periodsMatch: historicalEntry?.period === selectedPeriod,
      dataLength: historicalEntry?.data?.length || 0,
      hasError: !!historicalEntry?.error,
      validated: historicalEntry?.validated
    });
    
    // 🚀 CRITICAL FIX: Only use data if it matches the current period AND is validated
    if (!historicalEntry || 
        historicalEntry.period !== selectedPeriod || 
        !historicalEntry.validated ||
        historicalEntry.error) {
      console.warn(`⚠️ Invalid or mismatched data:`, {
        entryPeriod: historicalEntry?.period,
        selectedPeriod,
        validated: historicalEntry?.validated,
        error: historicalEntry?.error
      });
      return [];
    }
    
    const rawData = historicalEntry.data || [];
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.warn(`❌ No valid data for ${currentSymbol} ${selectedPeriod}`);
      return [];
    }
    
    // For intraday periods (1d, 5d), show all data
    // For longer periods, filter by isDisplayed flag if it exists
    let displayedData;
    if (selectedPeriod === '1d' || selectedPeriod === '5d') {
      displayedData = rawData;
      console.log(`📊 Intraday data (${selectedPeriod}): Using all ${rawData.length} points`);
    } else {
      const hasDisplayFlag = rawData.some(item => item && 'isDisplayed' in item);
      displayedData = hasDisplayFlag 
        ? rawData.filter(item => item && item.isDisplayed === true)
        : rawData;
      console.log(`📊 Daily data (${selectedPeriod}): Filtered to ${displayedData.length} from ${rawData.length} points`);
    }
    
    // Process and validate displayed data
    const validData = displayedData
      .filter(item => item && (item.date || item.timestamp))
      .map((item, index) => {
        // Handle both date and timestamp fields
        const dateValue = item.date || item.timestamp;
        let dateString;
        let displayDate;
        
        if (selectedPeriod === '1d' || selectedPeriod === '5d') {
          // For intraday, keep full timestamp
          const date = new Date(dateValue);
          dateString = date.toISOString();
          displayDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
          dateString = dateValue ? new Date(dateValue).toISOString().split('T')[0] : '';
          displayDate = null;
        }
        
        // Calculate price change for volume coloring
        let priceChange = 0;
        if (index > 0) {
          const currentPrice = typeof item.price === 'number' ? item.price : 
                             (typeof item.close === 'number' ? item.close : null);
          const prevPrice = typeof displayedData[index - 1].price === 'number' ? displayedData[index - 1].price : 
                          (typeof displayedData[index - 1].close === 'number' ? displayedData[index - 1].close : null);
          
          if (currentPrice !== null && prevPrice !== null && prevPrice !== 0) {
            priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;
          }
        }
        
        return {
          ...item,
          date: dateString,
          displayDate: displayDate,
          price: typeof item.price === 'number' ? item.price : 
                (typeof item.close === 'number' ? item.close : null),
          ma200: typeof item.ma200 === 'number' ? item.ma200 : null,
          rsi: typeof item.rsi === 'number' ? item.rsi : null,
          volume: typeof item.volume === 'number' ? item.volume : 0,
          priceChange: priceChange
        };
      })
      .filter(item => item.date && item.price !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // CRITICAL: Sort by date
    
    console.log(`✅ FINAL CHART DATA for ${selectedPeriod}:`, {
      totalPoints: validData.length,
      firstDate: validData[0]?.date,
      lastDate: validData[validData.length - 1]?.date,
      firstPrice: validData[0]?.price,
      lastPrice: validData[validData.length - 1]?.price,
      period: selectedPeriod,
      hasMA200: validData.some(item => item.ma200 !== null),
      hasRSI: validData.some(item => item.rsi !== null)
    });
    
    return validData;
  }, [historicalData, currentSymbol, selectedPeriod]);
  
  // 🚀 ENHANCED: Calculate dynamic return percentage based on timeframe
  const dynamicReturn = useMemo(() => {
    console.log(`💰 CALCULATING RETURN for ${selectedPeriod} with ${chartData.length} data points`);
    return calculateTimeframeReturn(chartData, selectedPeriod);
  }, [chartData, selectedPeriod]);
  
  // Use dynamic return if available, otherwise fall back to API return
  const displayReturn = dynamicReturn !== null ? dynamicReturn : (Number(currentData.change_p) || 0);
  const displayPrice = chartData.length > 0 ? 
    chartData[chartData.length - 1].price : 
    (Number(currentData.close) || 0);
  
  // Description text
  const descriptions = {
    'SPY': {
      basic: "The S&P 500 tracks the 500 biggest US companies. It's the main way to measure how the US stock market is doing.",
      advanced: "The S&P 500 is the benchmark US equity index with market-cap weighting across 11 sectors. Key technical signals include the 50/200-day moving averages and volume trends."
    },
    'QQQ': {
      basic: "The Nasdaq 100 follows the largest tech companies like Apple and Microsoft. Shows how tech stocks are performing.",
      advanced: "The Nasdaq 100 tracks major non-financial companies, heavily weighted toward technology. Higher volatility with strong growth orientation."
    },
    'DIA': {
      basic: "The Dow Jones tracks 30 major US companies. It's the oldest and most well-known market indicator.",
      advanced: "The DJIA is price-weighted across 30 blue-chip stocks. Less representative than S&P 500 but historically significant benchmark."
    },
    'IWM': {
      basic: "The Russell 2000 follows smaller US companies. These often show early signs of economic changes.",
      advanced: "The Russell 2000 represents small-cap US equities. Higher volatility, strong economic sensitivity, historically leads market cycles."
    }
  };
  
  const description = descriptions[currentSymbol] || { 
    basic: "Market index information", 
    advanced: "Market index technical information" 
  };
  
  // Format dates for x-axis based on period
  const formatDate = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (selectedPeriod === '1d') {
        // For 1 day, show time only
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
      } else if (selectedPeriod === '5d') {
        // For 5 days, show date and time
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
      } else if (selectedPeriod === '5y') {
        return `${d.getMonth() + 1}/${d.getFullYear()}`;
      } else {
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
    } catch (e) {
      return '';
    }
  };
  
  // Use keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Calculate Y-axis domains with padding
  const calculatePriceDomain = () => {
    if (!chartData || chartData.length === 0) {
      return [0, 100];
    }
    
    // For line chart, use price values and MA200
    const prices = chartData.map(d => Number(d.price)).filter(p => !isNaN(p) && p > 0);
    const ma200Values = chartData.map(d => Number(d.ma200)).filter(p => !isNaN(p) && p > 0);
    
    const allValues = [...prices, ...ma200Values];
    if (allValues.length === 0) return [0, 100];
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    const range = maxValue - minValue;
    const padding = range * 0.05;
    
    return [Math.max(0, minValue - padding), maxValue + padding];
  };
  
  const [domainMin, domainMax] = calculatePriceDomain();
  
  // EXTREMELY SMALL volume scaling to prevent ANY interference with price
  const calculateVolumeDomain = () => {
    if (!chartData || chartData.length === 0) return [0, 100];
    
    const volumes = chartData.map(d => Number(d.volume)).filter(v => !isNaN(v) && v >= 0);
    if (volumes.length === 0) return [0, 100];
    
    const maxVolume = Math.max(...volumes);
    // DRAMATICALLY REDUCED from 0.08x to 0.025x to keep volume bars TINY
    // This ensures volume stays in bottom 2.5% of chart and absolutely doesn't interfere with price
    return [0, maxVolume * 0.025];
  };
  
  const [volumeMin, volumeMax] = calculateVolumeDomain();
  
  // Determine the number of data points to display
  const visibleDataPoints = chartData;
  
  // Adjust chart height calculations - Simplified without VXX
  const mainChartHeight = 360;
  const rsiChartHeight = 120;
  const spacing = 10;
  
  // Calculate total height based on what's showing
  let totalHeight = mainChartHeight;
  if (selectedPeriod !== '1d' && selectedPeriod !== '5d') {
    const hasRsi = visibleDataPoints.some(item => item.rsi !== null && item.rsi !== undefined);
    if (hasRsi) {
      totalHeight += rsiChartHeight + spacing;
    }
  }
  
  // Get line color based on price change
  const getLineColor = () => {
    return displayReturn >= 0 ? '#22c55e' : '#ef4444';
  };
  
  // Check if we have the necessary data for charts
  const hasMa200 = visibleDataPoints.some(item => item.ma200 !== null && item.ma200 !== undefined);
  const hasRsi = visibleDataPoints.some(item => item.rsi !== null && item.rsi !== undefined);
  const hasData = visibleDataPoints.length > 0;
  
  // Hide RSI for intraday periods
  const showRSI = selectedPeriod !== '1d' && selectedPeriod !== '5d' && hasRsi;
  const showMA200 = selectedPeriod !== '1d' && selectedPeriod !== '5d' && hasMa200;
  
  // Number of empty state dots to display (max: 4)
  const numDots = Math.min(4, orderedIndices.length);
  
  // 🚀 FIXED: Enhanced period change handler - clear using clean symbol
  const handlePeriodChange = (period) => {
    console.log(`🔄 PERIOD CHANGE INITIATED: ${selectedPeriod} → ${period.value}`);
    
    // Clear historical data for current symbol to force fresh fetch
    setHistoricalData(prev => {
      const updated = { ...prev };
      delete updated[currentSymbol]; // Remove old entry using clean symbol
      console.log(`🧹 Cleared state for ${currentSymbol}`);
      return updated;
    });
    
    setSelectedPeriod(period.value);
  };
  
  // Calculate x-axis interval based on data points and period
  const getXAxisInterval = () => {
    if (selectedPeriod === '1d') {
      // For 1 day, show fewer ticks
      return Math.floor(Math.max(1, visibleDataPoints.length / 6));
    } else if (selectedPeriod === '5d') {
      // For 5 days, show moderate ticks
      return Math.floor(Math.max(1, visibleDataPoints.length / 8));
    } else {
      // For longer periods, show more ticks
      return Math.floor(Math.max(1, visibleDataPoints.length / 8));
    }
  };
  
  return (
    <div 
      className="bg-white rounded-xl shadow-lg relative overflow-hidden transition-all duration-300"
    >
      {/* Navigation arrows */}
      <button 
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goPrev}
        aria-label="Previous market index"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goNext}
        aria-label="Next market index"
      >
        <ChevronRight size={24} />
      </button>
      
      <div className="p-6">
        {/* Header / Title / Price */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {getDisplayName(currentSymbol)}
              </h3>
              <span className="text-sm text-gray-500">({currentSymbol})</span>
              <InfoTooltip
                basicContent={description.basic}
                advancedContent={description.advanced}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                ${displayPrice.toFixed(2)}
              </span>
              <div className="flex items-center gap-1">
                {displayReturn >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={`text-lg font-semibold ${displayReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {Math.abs(displayReturn).toFixed(2)}%
                </span>
                {/* 🚀 NEW: Show timeframe-specific return label */}
                <span className="text-sm text-gray-500 ml-1">
                  ({getReturnPeriodLabel(selectedPeriod)})
                </span>
              </div>
            </div>
          </div>
          
          {/* Carousel indicators */}
          <div className="flex gap-1">
            {Array.from({ length: numDots }).map((_, idx) => (
              <button 
                key={`indicator-${idx}`}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to ${getDisplayName(orderedIndices[idx]?.symbol || '')}`}
              />
            ))}
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="mb-4">
          <TimePeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {/* Chart */}
        {!hasData || isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="text-gray-600 mt-4">Loading {selectedPeriod} data...</p>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-500 mb-4" size={40} />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Historical Data Available</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Historical data for {getDisplayName(currentSymbol)} could not be loaded.
                  <br />
                  Please check API connectivity.
                </p>
              </>
            )}
          </div>
        ) : (
          <div style={{ height: totalHeight }} className="mt-4">
            {/* Combined price and volume chart */}
            <div style={{ height: mainChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={visibleDataPoints} 
                  margin={{ top: 5, right: 55, left: 15, bottom: 5 }}
                  syncId="marketCharts"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={formatDate}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickLine={{ stroke: '#e0e0e0' }}
                    interval={getXAxisInterval()}
                  />
                  
                  {/* Primary Y-axis for price */}
                  <YAxis
                    yAxisId="price"
                    domain={[domainMin, domainMax]}
                    tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tick={{ fill: '#666666', fontSize: 11 }}
                    tickLine={{ stroke: '#e0e0e0' }}
                    width={50}
                  />
                  
                  {/* Secondary Y-axis for volume - EXTREMELY CONSTRAINED */}
                  <YAxis
                    yAxisId="volume"
                    orientation="right"
                    domain={[volumeMin, volumeMax]}
                    axisLine={false}
                    tick={false}
                    tickLine={false}
                    width={0}
                    hide={true} // Completely hide volume Y-axis
                  />
                  
                  <Tooltip
                    content={<CustomTooltip />}
                  />
                  
                  {/* Volume bars - EXTREMELY TINY AND SUBTLE */}
                  <Bar
                    yAxisId="volume"
                    dataKey="volume"
                    shape={<CustomBar />}
                    name="Volume"
                    maxBarSize={2} // REDUCED from 3 to 2 - even smaller bars
                  />
                  
                  {/* Price Line */}
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke={getLineColor()}
                    dot={false}
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                    name="Price"
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                  
                  {/* MA200 Line - only if data exists and not intraday */}
                  {showMA200 && (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="ma200"
                      stroke="#6366f1"
                      strokeDasharray="5 5"
                      dot={false}
                      strokeWidth={2}
                      name="200-day MA"
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                  )}
                  
                  <Legend 
                    verticalAlign="bottom" 
                    height={30} 
                    content={(props) => {
                      const { payload } = props;
                      return (
                        <div className="flex justify-center gap-8 text-xs mt-1">
                          {payload.map((entry, index) => (
                            <div key={`item-${index}`} className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3" 
                                style={{ 
                                  backgroundColor: entry.dataKey === 'price' ? getLineColor() : 
                                                  entry.dataKey === 'volume' ? '#9ca3af' : '#6366f1',
                                  ...(entry.dataKey === 'ma200' && { border: '1px solid #6366f1', backgroundColor: 'white' }) 
                                }}
                              />
                              <span className="text-gray-600">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* RSI Chart - only for non-intraday periods */}
            {showRSI && (
              <div style={{ height: rsiChartHeight, marginTop: spacing }}>
                <div className="mb-1 text-xs font-semibold text-gray-600 px-3">RSI (Relative Strength Index)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={visibleDataPoints} 
                    margin={{ top: 5, right: 15, left: 15, bottom: 20 }}
                    syncId="marketCharts"
                  >
                    <defs>
                      <linearGradient id="rsiOversold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="rsiOverbought" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={formatDate}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={{ stroke: '#e0e0e0' }}
                      interval={getXAxisInterval()}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 30, 50, 70, 100]}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tick={{ fill: '#666666', fontSize: 10 }}
                      tickLine={{ stroke: '#e0e0e0' }}
                      width={35}
                    />
                    
                    {/* Overbought/Oversold zones */}
                    <Area
                      type="monotone"
                      dataKey={() => 30}
                      fill="url(#rsiOversold)"
                      stroke="none"
                    />
                    <Area
                      type="monotone"
                      dataKey={() => 100}
                      fill="url(#rsiOverbought)"
                      stroke="none"
                      stackId="upper"
                      baseValue={70}
                    />
                    
                    {/* Reference lines */}
                    <ReferenceLine 
                      y={30} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      label={{ 
                        value: 'Oversold', 
                        position: 'right', 
                        fill: '#10b981', 
                        fontSize: 10,
                        fontWeight: 'bold'
                      }} 
                    />
                    <ReferenceLine 
                      y={70} 
                      stroke="#ef4444" 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      label={{ 
                        value: 'Overbought', 
                        position: 'right', 
                        fill: '#ef4444', 
                        fontSize: 10,
                        fontWeight: 'bold'
                      }} 
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#6b7280"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                    
                    {/* RSI line */}
                    <Line
                      type="monotone"
                      dataKey="rsi"
                      stroke="#3b82f6"
                      dot={false}
                      strokeWidth={2}
                      name="RSI"
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
        
        {/* Description */}
        <div className="mt-4 text-sm text-gray-600">
          <p>{viewMode === 'basic' ? description.basic : description.advanced}</p>
          {/* 🚀 NEW: Show return calculation source */}
          {dynamicReturn !== null && (
            <p className="text-xs text-gray-500 mt-1">
              Return calculated from {getReturnPeriodLabel(selectedPeriod).toLowerCase()} historical data ({chartData.length} data points)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketMetricsCarousel;
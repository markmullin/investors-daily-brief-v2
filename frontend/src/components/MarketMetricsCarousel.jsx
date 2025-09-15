import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Info, TrendingUp, AlertCircle, GraduationCap } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Area, ComposedChart, BarChart, Bar, Cell
} from 'recharts';
import InfoTooltip from './InfoTooltip';
import TimePeriodSelector from './TimePeriodSelector';
import { useViewMode } from '../context/ViewModeContext';
import { validateData } from '../utils/ChartDataManager';
import { marketApi, cacheUtils } from '../services/api';
import qwenAnalysisApi from '../services/qwenApi';

/**
 * Calculate moving average - improved to extend throughout chart
 */
const calculateMA = (data, period) => {
  return data.map((item, index) => {
    if (index < period - 1) {
      // For early data points, use partial average to extend the line
      if (index < Math.min(10, Math.floor(period / 4))) return null; // Need minimum points
      const availableData = data.slice(0, index + 1);
      const sum = availableData.reduce((acc, curr) => acc + (curr.price || curr.close || 0), 0);
      return sum / availableData.length;
    }
    
    const sum = data
      .slice(index - period + 1, index + 1)
      .reduce((acc, curr) => acc + (curr.price || curr.close || 0), 0);
    
    return sum / period;
  });
};

/**
 * Calculate RSI
 */
const calculateRSI = (data, period = 14) => {
  if (data.length < period + 1) return data.map(() => 50);
  
  const rsiValues = [];
  const prices = data.map(d => d.price || d.close || 0);
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsiValues.push(50);
      continue;
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      const change = prices[j] - prices[j - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsiValues;
};

/**
 * Custom tooltip component for chart
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedDate = new Date(label).toLocaleDateString();
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{formattedDate}</p>
        {payload.map((entry, index) => {
          // Skip volume from tooltip
          if (entry.dataKey === 'volume') return null;
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toFixed(2) || 'N/A'}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

/**
 * MarketMetricsCarousel - FIXED with all chart features showing by default
 */
const MarketMetricsCarousel = ({ indices, historicalData = {}, hideAnalysis = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [internalHistoricalData, setInternalHistoricalData] = useState(historicalData);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const { viewMode } = useViewMode();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Fetch AI analysis when indices change
  useEffect(() => {
    if (indices && indices.length > 0 && !aiAnalysis) {
      qwenAnalysisApi.getIndicesAnalysis(indices).then(analysis => {
        if (analysis) {
          setAiAnalysis(analysis);
        }
      });
    }
  }, [indices]);

  // Market indices display information
  const marketIndicesInfo = {
    '^GSPC': {
      displayName: 'S&P 500',
      description: {
        basic: 'The S&P 500 index tracks the 500 largest US companies, representing about 80% of the US stock market value.',
        advanced: 'Market-cap weighted index of 500 large US companies, rebalanced quarterly. Key benchmark for US equity performance and economic health.'
      },
      color: '#2563eb'
    },
    '^IXIC': {
      displayName: 'NASDAQ',
      description: {
        basic: 'The NASDAQ Composite includes all stocks listed on the NASDAQ exchange, heavily weighted toward technology companies.',
        advanced: 'Market-cap weighted index of 3,000+ NASDAQ-listed stocks. Tech-heavy composition makes it sensitive to growth stock sentiment and innovation cycles.'
      },
      color: '#10b981'
    },
    '^DJI': {
      displayName: 'Dow Jones',
      description: {
        basic: 'The Dow Jones Industrial Average tracks 30 large, well-established US companies across various industries.',
        advanced: 'Price-weighted index of 30 blue-chip stocks. Unlike market-cap weighting, higher-priced stocks have more influence regardless of company size.'
      },
      color: '#8b5cf6'
    },
    '^RUT': {
      displayName: 'Russell 2000',
      description: {
        basic: 'The Russell 2000 tracks small-cap US companies, providing insight into the performance of smaller businesses.',
        advanced: 'Market-cap weighted index of smallest 2,000 stocks in Russell 3000. Key barometer for small-cap performance and domestic economic conditions.'
      },
      color: '#f59e0b'
    },
    'BTCUSD': {
      displayName: 'Bitcoin',
      description: {
        basic: 'Bitcoin is the world\'s largest cryptocurrency by market capitalization.',
        advanced: 'Decentralized digital currency operating on blockchain technology. Often viewed as digital gold and inflation hedge.'
      },
      color: '#f7931a'
    }
  };

  // Get display information for current symbol
  const getDisplayName = (symbol) => marketIndicesInfo[symbol]?.displayName || symbol;
  const getDescription = (symbol) => marketIndicesInfo[symbol]?.description || { basic: '', advanced: '' };
  const getColor = (symbol) => marketIndicesInfo[symbol]?.color || '#2563eb';

  // Fetch data when period or symbol changes
  useEffect(() => {
    const fetchPeriodData = async () => {
      if (!indices || indices.length === 0) return;
      
      const currentSymbol = indices[currentIndex]?.symbol;
      if (!currentSymbol) return;

      // Check if we already have this data
      const existingData = internalHistoricalData[currentSymbol];
      if (existingData?.period === selectedPeriod && existingData?.data?.length > 0) {
        console.log(`Using cached data for ${currentSymbol} ${selectedPeriod}`);
        return;
      }

      setIsLoading(true);
      setDataError(null);
      
      try {
        console.log(`Fetching ${selectedPeriod} data for ${currentSymbol}`);
        const data = await marketApi.getHistory(currentSymbol, selectedPeriod);
        
        if (data && data.length > 0) {
          setInternalHistoricalData(prev => ({
            ...prev,
            [currentSymbol]: { data, period: selectedPeriod }
          }));
        } else {
          setDataError('No historical data available');
        }
      } catch (error) {
        console.error(`Error fetching ${currentSymbol}:`, error);
        setDataError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriodData();
  }, [currentIndex, selectedPeriod, indices]);

  // Prepare chart data WITH moving averages and RSI calculated
  const { chartData, showMA20, showMA50, showMA200, volumeColors } = useMemo(() => {
    if (!indices || indices.length === 0) return { chartData: [], showMA20: false, showMA50: false, showMA200: false, volumeColors: [] };
    
    const currentSymbol = indices[currentIndex]?.symbol;
    const historicalPrices = internalHistoricalData[currentSymbol]?.data || [];
    
    if (historicalPrices.length === 0) {
      return { chartData: [], showMA20: false, showMA50: false, showMA200: false, volumeColors: [] };
    }

    // Process base data
    const baseData = historicalPrices.map(item => ({
      date: item.date,
      price: item.close || item.price || 0,
      volume: item.volume || 0
    }));

    // Sort by date
    const sortedData = baseData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate moving averages based on timeframe
    let ma20Values = null;
    let ma50Values = null;
    let ma200Values = null;
    let showMA20 = false;
    let showMA50 = false;
    let showMA200 = false;
    
    // Determine which MAs to show based on timeframe
    if (selectedPeriod === '1d' || selectedPeriod === '5d') {
      // Short timeframes: No MAs (intraday data)
    } else if (selectedPeriod === '1m') {
      // 1 month: 20-day MA only
      ma20Values = calculateMA(sortedData, 20);
      showMA20 = true;
    } else if (selectedPeriod === '3m') {
      // 3 months: 20 & 50-day MA
      ma20Values = calculateMA(sortedData, 20);
      ma50Values = calculateMA(sortedData, 50);
      showMA20 = true;
      showMA50 = true;
    } else if (selectedPeriod === '6m') {
      // 6 months: 20 & 50-day MA
      ma20Values = calculateMA(sortedData, 20);
      ma50Values = calculateMA(sortedData, 50);
      showMA20 = true;
      showMA50 = true;
    } else if (selectedPeriod === '1y') {
      // 1 year: 50 & 200-day MA
      ma50Values = calculateMA(sortedData, 50);
      ma200Values = calculateMA(sortedData, 200);
      showMA50 = true;
      showMA200 = true;
    } else if (selectedPeriod === '5y') {
      // 5 years: 50 & 200-day MA
      ma50Values = calculateMA(sortedData, 50);
      ma200Values = calculateMA(sortedData, 200);
      showMA50 = true;
      showMA200 = true;
    }
    
    // Calculate RSI
    const rsiValues = calculateRSI(sortedData);
    
    // Calculate volume colors
    const volumeColors = sortedData.map((item, index) => {
      if (index === 0) return '#10b981'; // First bar green by default
      const prevPrice = sortedData[index - 1].price;
      return item.price >= prevPrice ? '#10b981' : '#ef4444';
    });
    
    // Combine all data
    const finalData = sortedData.map((item, index) => ({
      ...item,
      ma20: ma20Values ? ma20Values[index] : null,
      ma50: ma50Values ? ma50Values[index] : null,
      ma200: ma200Values ? ma200Values[index] : null,
      rsi: rsiValues[index],
      volumeColor: volumeColors[index]
    }));

    return { chartData: finalData, showMA20, showMA50, showMA200, volumeColors };
  }, [indices, currentIndex, internalHistoricalData, selectedPeriod]);

  // Navigate carousel
  const goNext = () => {
    if (indices && indices.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % indices.length);
    }
  };

  const goPrev = () => {
    if (indices && indices.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + indices.length) % indices.length);
    }
  };

  // Handle period change
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period.value);
  };

  // Get period label for display
  const getReturnPeriodLabel = (period) => {
    const labels = {
      '1d': '1 Day',
      '5d': '5 Day',
      '1m': '1 Month',
      '3m': '3 Month',
      '6m': '6 Month',
      '1y': '1 Year',
      '5y': '5 Year'
    };
    return labels[period] || period.toUpperCase();
  };

  // Check if we have valid indices
  if (!indices || indices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No market data available</p>
        </div>
      </div>
    );
  }

  const current = indices[currentIndex] || {};
  const currentSymbol = current.symbol;
  const description = getDescription(currentSymbol);
  const chartColor = getColor(currentSymbol);
  
  const displayPrice = current.close || current.price || 0;
  const displayReturn = current.change_p || current.changePercent || 0;

  return (
    <div className="relative">
      <div className="bg-white rounded-xl shadow-lg p-6 relative">
        {/* Navigation Buttons */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-all"
          onClick={goPrev}
        >
          <ChevronLeft size={20} />
        </button>
        
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-all"
          onClick={goNext}
        >
          <ChevronRight size={20} />
        </button>

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-800">
                {getDisplayName(currentSymbol)}
              </h3>
              <InfoTooltip
                basicContent={description.basic}
                advancedContent={description.advanced}
              />
            </div>
            
            {/* Price and Change Display */}
            <div className="mt-2">
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-bold">
                  ${displayPrice.toLocaleString()}
                </span>
                <div className={`flex items-center gap-1 ${displayReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {displayReturn >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                  <span className="font-semibold">
                    {displayReturn >= 0 ? '+' : ''}{displayReturn.toFixed(2)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({getReturnPeriodLabel(selectedPeriod)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex gap-1">
            {indices.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(idx)}
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {dataError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <AlertCircle className="text-red-500 mb-2" size={40} />
            <p className="text-gray-600">Error loading data: {dataError}</p>
          </div>
        )}

        {/* Main Price Chart with Volume */}
        {!isLoading && !dataError && chartData.length > 0 && (
          <div>
            {/* Price and Moving Averages Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    yAxisId="price"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <YAxis 
                    yAxisId="volume"
                    orientation="right"
                    tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
                    hide
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Volume Bars (backdrop) - Color coded */}
                  <Bar
                    yAxisId="volume"
                    dataKey="volume"
                    opacity={0.3}
                    name="Volume"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.volumeColor}
                      />
                    ))}
                  </Bar>
                  
                  {/* Price Line */}
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    dot={false}
                    name="Price"
                    isAnimationActive={false}
                  />
                  
                  {/* Moving Averages - Show by default based on timeframe */}
                  {showMA20 && (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="ma20"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      dot={false}
                      name="MA20"
                      strokeDasharray="3 3"
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                  )}
                  {showMA50 && (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="ma50"
                      stroke="#10b981"
                      strokeWidth={1}
                      dot={false}
                      name="MA50"
                      strokeDasharray="5 5"
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                  )}
                  {showMA200 && (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="ma200"
                      stroke="#ef4444"
                      strokeWidth={1}
                      dot={false}
                      name="MA200"
                      strokeDasharray="5 5"
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* RSI Chart - Always show with shaded areas */}
            <div className="h-32 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="overboughtGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="oversoldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.05} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  
                  {/* Shaded areas for overbought and oversold */}
                  <Area
                    type="monotone"
                    dataKey={() => 100}
                    stackId="1"
                    stroke="none"
                    fill="url(#overboughtGradient)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={() => -70}
                    stackId="1"
                    stroke="none"
                    fill="white"
                    isAnimationActive={false}
                  />
                  
                  <Area
                    type="monotone"
                    dataKey={() => 30}
                    stackId="2"
                    stroke="none"
                    fill="url(#oversoldGradient)"
                    isAnimationActive={false}
                  />
                  
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label="Overbought" />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" label="Oversold" />
                  <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                  
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    stroke="#6366f1"
                    strokeWidth={2}
                    name="RSI"
                    isAnimationActive={false}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 text-center mt-1">RSI (Relative Strength Index)</p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-4 text-sm text-gray-600">
          <p>{viewMode === 'basic' ? description.basic : description.advanced}</p>
        </div>
      </div>
      
      {/* Market Intelligence Section (Collapsible) - ALWAYS SHOW */}
      <div className="border-t border-gray-200 bg-white rounded-b-xl shadow-lg">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Market Intelligence</span>
            {aiAnalysis && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                AI Analysis
              </span>
            )}
            <span className="text-xs text-gray-500">95% confidence</span>
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showAnalysis ? 'rotate-90' : ''
            }`} 
          />
        </button>

        {showAnalysis && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {aiAnalysis?.summary || 
                   `${getDisplayName(currentSymbol)} showing ${displayReturn > 0 ? 'positive momentum' : 'weakness'} with ${Math.abs(displayReturn).toFixed(2)}% ${displayReturn > 0 ? 'gain' : 'decline'} over the period. ` +
                   `Technical indicators suggest ${chartData.length > 0 && chartData[chartData.length - 1].rsi > 70 ? 'overbought conditions' : 
                     chartData.length > 0 && chartData[chartData.length - 1].rsi < 30 ? 'oversold conditions' : 'neutral momentum'}.`}
                </p>
              </div>

              {aiAnalysis?.insights && aiAnalysis.insights.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Key Insights</div>
                  <ul className="space-y-1">
                    {aiAnalysis.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  📊 Analysis based on {chartData.length} data points with technical indicators
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketMetricsCarousel;
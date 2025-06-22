import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Info } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart
} from 'recharts';
import InfoTooltip from '../InfoTooltip';

/**
 * Formats values based on their type
 * @param {number} value - The value to format
 * @param {string} type - The type of value (percent, currency, index)
 * @returns {string} - Formatted value
 */
const formatValue = (value, type) => {
  if (value === undefined || value === null) return '-';
  
  // Format based on indicator type
  switch (type) {
    case 'dollar_index':
      return value.toFixed(2); // No % symbol for dollar index
    case 'percent':
    default:
      return `${value.toFixed(2)}%`;
  }
};

/**
 * Custom tooltip component for economic indicators with enhanced explanations
 */
const CustomTooltip = ({ active, payload, label, indicator, yoy }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Special handling for dual-axis charts
    if (indicator?.isDualAxis) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
          <p className="font-bold text-gray-800 text-lg border-b pb-2 mb-2">
            {data.date ? new Date(data.date).toLocaleDateString() : ''}
          </p>
          <div className="grid gap-y-2">
            <div>
              <p className="font-semibold text-amber-600">{indicator.leftAxis.label}</p>
              <p className="font-bold text-lg text-amber-600">
                {data.unemployment ? `${data.unemployment.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-blue-600">{indicator.rightAxis.label}</p>
              <p className="font-bold text-lg text-blue-600">
                {data.retailSales ? `${data.retailSales.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
        <p className="font-bold text-gray-800 text-lg border-b pb-2 mb-2">
          {data.date ? new Date(data.date).toLocaleDateString() : ''}
        </p>
        <div className="grid gap-y-2">
          <div>
            <p className="font-semibold text-gray-700">{indicator?.title || 'Value'}</p>
            <p className="font-bold text-lg">
              {formatValue(data.value, indicator?.valueType)}
            </p>
            <p className="text-xs text-gray-600 mt-1">{getMetricExplanation(indicator?.id)}</p>
          </div>
          
          {yoy && data.yoyChange !== undefined && (
            <div className="mt-1 pt-2 border-t">
              <p className="font-semibold text-gray-700">Year-over-Year Change</p>
              <p className={`font-bold text-lg ${
                data.yoyChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.yoyChange >= 0 ? '+' : ''}{data.yoyChange.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                How this indicator has changed compared to the same period last year.
              </p>
            </div>
          )}
          
          <div className="mt-1 pt-2 border-t">
            <p className="font-semibold text-gray-700">Indicator Significance</p>
            <p className="text-sm text-gray-700 mt-1">
              {getIndicatorSignificance(indicator?.id)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Get detailed explanation for a metric
 * @param {string} id - Indicator ID
 * @returns {string} - Explanation text
 */
const getMetricExplanation = (id) => {
  const explanations = {
    'DGS10': 'The interest rate paid on 10-year U.S. Treasury bonds. Movements reflect market expectations about future economic conditions.',
    'UNRATE': 'The percentage of the labor force that is jobless and actively seeking employment.',
    'GDPC1': 'The growth rate of the total value of all goods and services produced in the U.S., adjusted for inflation.',
    'CPIAUCSL': 'The rate of change in prices paid by consumers for a basket of goods and services.',
    'PCEPI': 'The change in prices of goods and services purchased by consumers, as measured by the Federal Reserve.',
    'BBKMCOIN': 'A model-based measure combining multiple economic indicators to track business cycle conditions.',
    'BBKMCLA': 'The lagging subcomponent of the BBK index that reflects historically observed economic conditions.',
    'USALOLITONOSTSAM': 'A forward-looking composite indicator designed to signal upcoming changes in business cycles.',
    'USSLIND': 'A composite index designed to predict the direction of economic activity in the coming months.',
    'CFNAI': 'A measure of overall economic activity and related inflationary pressure.',
    'DTWEXBGS': 'This index shows the absolute value of the US dollar against a weighted basket of foreign currencies. A higher index value indicates a stronger dollar.',
    'LABOR_CONSUMER_HEALTH': 'Combined unemployment rate and retail sales growth showing both labor market strength and consumer spending activity.',
    default: 'This value represents the current level of this economic indicator.'
  };
  
  return explanations[id] || explanations.default;
};

/**
 * Get the economic significance of an indicator
 * @param {string} id - Indicator ID
 * @returns {string} - Significance explanation
 */
const getIndicatorSignificance = (id) => {
  const significance = {
    'DGS10': 'Rising yields often suggest economic growth and inflation expectations are increasing. Falling yields may signal economic concerns or lower inflation expectations.',
    'UNRATE': 'Low unemployment generally indicates economic strength, but extremely low rates can signal labor market tightness and potential wage inflation.',
    'GDPC1': 'Strong positive growth indicates economic expansion, while negative growth for two consecutive quarters traditionally defines a recession.',
    'CPIAUCSL': 'High inflation erodes purchasing power and may prompt the Federal Reserve to raise interest rates. Low inflation or deflation may indicate economic weakness.',
    'PCEPI': 'The Federal Reserve\'s preferred inflation gauge. Values near 2% annually align with the Fed\'s target for price stability.',
    'BBKMCOIN': 'Positive values indicate above-average economic growth; negative values suggest below-average growth or contraction.',
    'BBKMCLA': 'This component tends to follow rather than lead economic changes, confirming the direction of economic cycles.',
    'USALOLITONOSTSAM': 'Values above 100 suggest economic expansion in coming months; values below 100 suggest potential contraction.',
    'USSLIND': 'Positive values forecast economic growth; negative values may signal upcoming economic weakness.',
    'CFNAI': 'Values above zero indicate above-trend growth; values below zero indicate below-trend growth.',
    'DTWEXBGS': 'The US Dollar Index shows the dollar\'s value against a basket of major currencies. A rising index indicates a strengthening dollar, which can reduce export competitiveness but improve purchasing power for imports. A falling index indicates a weakening dollar, which can boost exports but increase import costs.',
    'LABOR_CONSUMER_HEALTH': 'Low unemployment with strong retail sales growth indicates a healthy economy. Rising unemployment or declining retail sales can signal economic weakness.',
    default: 'This indicator helps economists and investors gauge economic conditions and make informed decisions.'
  };
  
  return significance[id] || significance.default;
};

/**
 * MacroIndicatorCarousel - Displays a carousel of macroeconomic indicators
 */
const MacroIndicatorCarousel = ({ indicators, data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Only proceed if we have data
  if (!indicators || indicators.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 h-72 flex items-center justify-center">
        <div className="text-gray-500">No indicator data available</div>
      </div>
    );
  }
  
  const currentIndicator = indicators[currentIndex];
  const currentData = data[currentIndicator?.id] || [];
  const isYoYIndicator = currentIndicator?.yoy || false;
  
  // Navigation functions
  const goNext = () => {
    setCurrentIndex((prev) => (prev === indicators.length - 1 ? 0 : prev + 1));
  };
  
  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? indicators.length - 1 : prev - 1));
  };
  
  // Format dates for x-axis
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2)}`;
    } catch (e) {
      return '';
    }
  };
  
  // Transform data to percentages where appropriate
  const transformDataToPercentages = (rawData, indicatorId, valueType) => {
    if (!rawData || rawData.length === 0) return [];
    
    // For dual-axis charts, return data as-is (already processed)
    if (indicatorId === 'LABOR_CONSUMER_HEALTH') {
      return rawData;
    }
    
    // For US Dollar Index, use the raw values directly (no percentage transformation)
    if (indicatorId === 'DTWEXBGS' || valueType === 'dollar_index') {
      // Keep absolute values for the US Dollar Index
      return rawData;
    }
    
    // For indicators that are already percentages, return as is
    const alreadyPercentages = ['UNRATE', 'DGS10'];
    if (alreadyPercentages.includes(indicatorId)) {
      return rawData;
    }
    
    // For GDP, calculate period-over-period change
    if (indicatorId === 'GDPC1') {
      return rawData.map((item, index, arr) => {
        if (index === arr.length - 1) {
          return { ...item, value: 0 }; // No previous period for the last item
        }
        const prev = arr[index + 1].value;
        const percentChange = prev !== 0 ? ((item.value - prev) / prev) * 100 : 0;
        return { ...item, value: percentChange };
      });
    }
    
    // For indices like CPI, calculate period-over-period percent change
    return rawData.map((item, index, arr) => {
      if (index === arr.length - 1) {
        return { ...item, value: 0 }; // No previous period for the last item
      }
      const prev = arr[index + 1].value;
      const percentChange = prev !== 0 ? ((item.value - prev) / prev) * 100 : 0;
      return { ...item, value: percentChange };
    });
  };
  
  // Transform data based on indicator's requirements
  const processedData = transformDataToPercentages(currentData, currentIndicator?.id, currentIndicator?.valueType);
  
  // Calculate domain with padding
  const calculateDomain = () => {
    if (!processedData || processedData.length === 0) {
      return [-5, 5]; // Default domain
    }
    
    // Special handling for dual-axis charts
    if (currentIndicator?.isDualAxis) {
      return [0, 10]; // Use default range for dual-axis
    }
    
    const values = processedData.map(d => d.value).filter(v => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const range = max - min;
    const padding = range * 0.2;
    
    return [min - padding, max + padding];
  };
  
  // FIXED: Calculate dual-axis domains with clean formatting
  const calculateDualAxisDomains = () => {
    if (!processedData || processedData.length === 0) {
      return { leftDomain: [3, 5], rightDomain: [0, 10] };
    }
    
    const unemploymentValues = processedData.map(d => d.unemployment).filter(v => v !== null && !isNaN(v));
    const retailSalesValues = processedData.map(d => d.retailSales).filter(v => v !== null && !isNaN(v));
    
    // Calculate unemployment domain (left axis)
    const unemploymentMin = Math.min(...unemploymentValues);
    const unemploymentMax = Math.max(...unemploymentValues);
    const unemploymentRange = unemploymentMax - unemploymentMin;
    const unemploymentPadding = unemploymentRange * 0.1;
    
    // Calculate retail sales domain (right axis)  
    const retailSalesMin = Math.min(...retailSalesValues);
    const retailSalesMax = Math.max(...retailSalesValues);
    const retailSalesRange = retailSalesMax - retailSalesMin;
    const retailSalesPadding = retailSalesRange * 0.1;
    
    return {
      leftDomain: [
        parseFloat((unemploymentMin - unemploymentPadding).toFixed(1)),
        parseFloat((unemploymentMax + unemploymentPadding).toFixed(1))
      ],
      rightDomain: [
        parseFloat((retailSalesMin - retailSalesPadding).toFixed(1)),
        parseFloat((retailSalesMax + retailSalesPadding).toFixed(1))
      ]
    };
  };
  
  // Determine trend direction (up, down, or neutral)
  const getTrendDirection = () => {
    if (processedData.length < 2) return 'neutral';
    
    let latest, previous;
    
    if (currentIndicator?.isDualAxis) {
      latest = processedData[processedData.length - 1]?.unemployment || 0;
      previous = processedData[processedData.length - 2]?.unemployment || 0;
    } else {
      latest = processedData[0]?.value || 0;
      previous = processedData[1]?.value || 0;
    }
    
    if (Math.abs(latest - previous) < 0.1) return 'neutral';
    return latest > previous ? 'up' : 'down';
  };
  
  // Determine if the trend is positive or negative based on desired trend
  const isTrendPositive = () => {
    const direction = getTrendDirection();
    const desired = currentIndicator?.desiredTrend;
    
    if (direction === 'neutral') return true;
    
    if (desired === 'higher') {
      return direction === 'up';
    } else if (desired === 'lower') {
      return direction === 'down';
    } else { // desired === 'stable'
      return direction === 'neutral';
    }
  };
  
  // Latest value and change
  const getLatestValues = () => {
    if (currentIndicator?.isDualAxis && processedData.length > 0) {
      const latest = processedData[processedData.length - 1];
      const previous = processedData[processedData.length - 2];
      return {
        unemployment: latest?.unemployment || 0,
        retailSales: latest?.retailSales || 0,
        unemploymentChange: previous ? (latest?.unemployment || 0) - (previous?.unemployment || 0) : 0,
        retailSalesChange: previous ? (latest?.retailSales || 0) - (previous?.retailSales || 0) : 0
      };
    } else {
      const latestValue = processedData[0]?.value || 0;
      const previousValue = processedData[1]?.value || latestValue;
      return {
        value: latestValue,
        change: latestValue - previousValue
      };
    }
  };
  
  const latestValues = getLatestValues();
  const trendDirection = getTrendDirection();
  const trendPositive = isTrendPositive();
  
  // Visible data points
  const visibleDataPoints = processedData.slice(0, 36); // Show 3 years of monthly data
  
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
  
  // Chart configuration
  const chartColor = trendPositive ? '#22c55e' : '#ef4444';
  const [yMin, yMax] = calculateDomain();
  
  // FIXED: Format Y-axis tick based on indicator type with clean decimals
  const formatYAxisTick = (val) => {
    if (currentIndicator?.valueType === 'dollar_index') {
      return val.toFixed(1); // No % for dollar index, 1 decimal place
    }
    return `${val.toFixed(1)}%`; // 1 decimal place for percentages
  };
  
  // FIXED: Format Y-axis tick for dual-axis charts with EXTRA CLEAN formatting
  const formatLeftYAxisTick = (val) => {
    // Handle very small numbers that should be zero
    if (Math.abs(val) < 0.01) return '0.0%';
    return `${val.toFixed(1)}%`;
  };
  
  const formatRightYAxisTick = (val) => {
    // Handle very small numbers that should be zero
    if (Math.abs(val) < 0.01) return '0.0%';
    return `${val.toFixed(1)}%`;
  };
  
  // Render dual-axis chart
  if (currentIndicator?.isDualAxis) {
    const { leftDomain, rightDomain } = calculateDualAxisDomains();
    
    return (
      <div className="bg-white rounded-lg relative overflow-hidden transition-all duration-300">
        {/* Navigation arrows */}
        <button 
          className="absolute left-2 top-1/3 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                     text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
          onClick={goPrev}
          aria-label="Previous indicator"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          className="absolute right-2 top-1/3 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                     text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
          onClick={goNext}
          aria-label="Next indicator"
        >
          <ChevronRight size={24} />
        </button>
        
        <div className="p-4">
          {/* Header for dual-axis */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentIndicator.title}
                </h3>
                <InfoTooltip content={
                  <div className="max-w-xs">
                    <p className="mb-2">{currentIndicator.description}</p>
                    <p className="font-semibold mt-2">Interpretation:</p>
                    <p>{getIndicatorSignificance(currentIndicator.id)}</p>
                  </div>
                } />
              </div>
              <div className="mt-2 flex items-baseline gap-6">
                <div>
                  <span className="text-lg font-bold text-amber-600">
                    {latestValues.unemployment?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">Unemployment</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-blue-600">
                    {latestValues.retailSales?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">Retail Sales YoY</span>
                </div>
              </div>
            </div>
            
            {/* Indicator navigation dots */}
            <div className="flex gap-1">
              {indicators.map((_, idx) => (
                <button 
                  key={`indicator-${idx}`}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'}`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to ${indicators[idx]?.name || ''}`}
                />
              ))}
            </div>
          </div>

          {/* Dual-axis Chart */}
          <div style={{ height: 320 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={visibleDataPoints} 
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={formatDate}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tick={{ fill: '#666666', fontSize: 11 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  interval={Math.floor(visibleDataPoints.length / 6)}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={leftDomain}
                  tickFormatter={formatLeftYAxisTick}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tick={{ fill: '#f59e0b', fontSize: 11 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  width={60}
                  label={{ value: 'Unemployment (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#f59e0b' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={rightDomain}
                  tickFormatter={formatRightYAxisTick}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tick={{ fill: '#3b82f6', fontSize: 11 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  width={60}
                  label={{ value: 'Retail Sales (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#3b82f6' } }}
                />
                <Tooltip
                  content={<CustomTooltip indicator={currentIndicator} />}
                />
                
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="unemployment"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Unemployment Rate"
                  isAnimationActive={false}
                  connectNulls={true}
                />
                
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="retailSales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Retail Sales (YoY)"
                  isAnimationActive={false}
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Description */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-1">What This Means:</h4>
            <p className="text-sm text-gray-600">{getIndicatorSignificance(currentIndicator.id)}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Regular single-axis chart
  return (
    <div className="bg-white rounded-lg relative overflow-hidden transition-all duration-300">
      {/* Navigation arrows */}
      <button 
        className="absolute left-2 top-1/3 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goPrev}
        aria-label="Previous indicator"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        className="absolute right-2 top-1/3 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md 
                   text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
        onClick={goNext}
        aria-label="Next indicator"
      >
        <ChevronRight size={24} />
      </button>
      
      <div className="p-4">
        {/* Header / Title / Current Value */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {currentIndicator.title}
              </h3>
              <InfoTooltip content={
                <div className="max-w-xs">
                  <p className="mb-2">{currentIndicator.description}</p>
                  <p className="font-semibold mt-2">Interpretation:</p>
                  <p>{getIndicatorSignificance(currentIndicator.id)}</p>
                </div>
              } />
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold">
                {formatValue(latestValues.value, currentIndicator.valueType)}
              </span>
              <div className="flex items-center gap-1">
                {latestValues.change >= 0 ? (
                  <ArrowUp className={trendPositive ? "text-green-500" : "text-red-500"} size={20} />
                ) : (
                  <ArrowDown className={trendPositive ? "text-red-500" : "text-green-500"} size={20} />
                )}
                <span className={trendPositive ? "text-green-500" : "text-red-500"}>
                  {Math.abs(latestValues.change).toFixed(2)}
                  {currentIndicator.valueType !== 'dollar_index' && '%'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Indicator navigation dots */}
          <div className="flex gap-1">
            {indicators.map((_, idx) => (
              <button 
                key={`indicator-${idx}`}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to ${indicators[idx]?.name || ''}`}
              />
            ))}
          </div>
        </div>

        {/* Main Chart */}
        <div style={{ height: 320 }} className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={visibleDataPoints} 
              margin={{ top: 5, right: 15, left: 15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                tickFormatter={formatDate}
                axisLine={{ stroke: '#e0e0e0' }}
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#e0e0e0' }}
                interval={Math.floor(visibleDataPoints.length / 6)}
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={formatYAxisTick}
                axisLine={{ stroke: '#e0e0e0' }}
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#e0e0e0' }}
                width={60}
              />
              <Tooltip
                content={<CustomTooltip indicator={currentIndicator} yoy={isYoYIndicator} />}
              />
              
              {/* Zero line reference - only for percentage indicators */}
              {currentIndicator.valueType !== 'dollar_index' && (
                <ReferenceLine 
                  y={0} 
                  stroke="#9ca3af" 
                  strokeDasharray="3 3" 
                />
              )}
              
              {/* Threshold line if applicable */}
              {currentIndicator.threshold !== undefined && (
                <ReferenceLine 
                  y={currentIndicator.threshold} 
                  stroke="#9ca3af" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Threshold', 
                    position: 'insideBottomRight', 
                    fill: '#9ca3af', 
                    fontSize: 10 
                  }} 
                />
              )}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                dot={false}
                activeDot={{ r: 6 }}
                strokeWidth={2}
                name={currentIndicator.name}
                isAnimationActive={false}
                connectNulls={true}
              />
              
              {/* Year-over-Year change if applicable */}
              {isYoYIndicator && (
                <Line
                  type="monotone"
                  dataKey="yoyChange"
                  stroke="#6366f1"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={1.5}
                  name="YoY Change %"
                  isAnimationActive={false}
                  connectNulls={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Description with enhanced explanation */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <h4 className="font-semibold text-gray-700 mb-1">What This Means:</h4>
          <p className="text-sm text-gray-600">{getIndicatorSignificance(currentIndicator.id)}</p>
          
          <h4 className="font-semibold text-gray-700 mt-3 mb-1">Current Reading:</h4>
          <p className="text-sm text-gray-600">
            {currentIndicator.valueType === 'dollar_index' ? (
              // Special text for dollar index
              `The US Dollar Index is currently at ${formatValue(latestValues.value, 'dollar_index')}, 
              ${Math.abs(latestValues.change).toFixed(2)} points ${latestValues.change >= 0 ? 'higher' : 'lower'} than the previous period.`
            ) : (
              // Default text for percentage-based indicators
              `${latestValues.value > 0 ? 'Positive' : latestValues.value < 0 ? 'Negative' : 'Neutral'} at ${formatValue(latestValues.value, currentIndicator.valueType)}, 
              ${Math.abs(latestValues.change).toFixed(2)}% ${latestValues.change >= 0 ? 'higher' : 'lower'} than previous period.`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MacroIndicatorCarousel;
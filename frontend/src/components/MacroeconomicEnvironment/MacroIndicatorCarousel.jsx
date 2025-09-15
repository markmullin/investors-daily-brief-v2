import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Bar, Legend
} from 'recharts';

/**
 * Format value based on type
 */
const formatValue = (value, type) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'billions':
      return `$${value.toFixed(0)}B`;
    case 'trillions':
      return `$${value.toFixed(1)}T`;
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'index':
      return value.toFixed(2);
    case 'dollar_index':
      return value.toFixed(2);
    default:
      return value.toFixed(2);
  }
};

/**
 * Custom tooltip for grouped charts
 */
const GroupedTooltip = ({ active, payload, label, indicator }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800 mb-2">
          {label ? new Date(label).toLocaleDateString() : ''}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-semibold">
              {formatValue(entry.value, indicator.valueType)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Enhanced Macroeconomic Indicator Carousel with Animations
 */
const MacroIndicatorCarousel = ({ indicators, data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  if (!indicators || indicators.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 h-72 flex items-center justify-center">
        <div className="text-gray-500">No indicator data available</div>
      </div>
    );
  }
  
  const currentIndicator = indicators[currentIndex];
  const rawData = data[currentIndicator?.id] || [];
  
  // Filter data to ensure 2 years of history
  const getFilteredData = () => {
    if (!rawData || rawData.length === 0) return [];
    
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    return rawData.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= twoYearsAgo;
    });
  };
  
  const currentData = getFilteredData();
  
  // Animation trigger when chart changes
  useEffect(() => {
    setIsAnimating(true);
    setAnimationKey(prev => prev + 1); // Force re-mount for animation
    const timer = setTimeout(() => setIsAnimating(false), 1500);
    return () => clearTimeout(timer);
  }, [currentIndex]);
  
  // Navigation
  const goNext = () => {
    setCurrentIndex((prev) => (prev === indicators.length - 1 ? 0 : prev + 1));
  };
  
  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? indicators.length - 1 : prev - 1));
  };
  
  // Get latest value for display
  const getLatestValue = () => {
    if (!currentData || currentData.length === 0) return null;
    
    const lastPoint = currentData[currentData.length - 1];
    
    // Special handling for Money Supply with dual metrics
    if (currentIndicator.id === 'MONEY_SUPPLY') {
      return [
        { 
          name: 'M2', 
          value: lastPoint.M2_ABSOLUTE ? `$${(lastPoint.M2_ABSOLUTE).toFixed(1)}T (${lastPoint.M2_YOY ? lastPoint.M2_YOY.toFixed(1) : 'N/A'}% YoY)` : 'N/A', 
          color: '#8b5cf6',
          isComposite: true
        },
        { 
          name: 'MMF', 
          value: lastPoint.MONEY_MARKET_FUNDS ? `$${lastPoint.MONEY_MARKET_FUNDS.toFixed(1)}T (${lastPoint.MMF_YOY ? lastPoint.MMF_YOY.toFixed(1) : 'N/A'}% YoY)` : 'N/A', 
          color: '#3b82f6',
          isComposite: true
        }
      ];
    }
    
    if (currentIndicator.isGroup && currentIndicator.series) {
      // For grouped charts, show multiple values
      return currentIndicator.series.map(s => {
        const value = lastPoint[s.dataKey];
        return {
          name: s.name,
          value: value,
          color: s.color
        };
      }).filter(v => v.value !== null && v.value !== undefined);
    }
    
    if (currentIndicator.isDualAxis) {
      return [
        { name: currentIndicator.leftAxis.label, value: lastPoint[currentIndicator.leftAxis.dataKey], color: currentIndicator.leftAxis.color },
        { name: currentIndicator.rightAxis.label, value: lastPoint[currentIndicator.rightAxis.dataKey], color: currentIndicator.rightAxis.color }
      ].filter(v => v.value !== null && v.value !== undefined);
    }
    
    return [{ name: 'Value', value: lastPoint.value, color: currentIndicator.color || '#3b82f6' }];
  };
  
  const latestValues = getLatestValue();
  
  // Render chart based on type
  const renderChart = () => {
    if (!currentData || currentData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      );
    }
    
    // Multi-line chart for grouped indicators (with shaded areas for specific metrics)
    if (currentIndicator.isGroup && currentIndicator.series) {
      // Special handling for Labor Consumer group - add yellow shaded area for unemployment
      if (currentIndicator.id === 'LABOR_CONSUMER_HEALTH') {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={currentData} key={animationKey}>
              <defs>
                <linearGradient id="unemploymentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatValue(value, currentIndicator.valueType)}
              />
              <Tooltip content={<GroupedTooltip indicator={currentIndicator} />} />
              <Legend />
              {/* Unemployment with yellow shaded area */}
              <Area
                type="monotone"
                dataKey="unemployment"
                stroke="#f59e0b"
                fill="url(#unemploymentGradient)"
                name="Unemployment Rate"
                strokeWidth={2}
                dot={false}
                connectNulls
                animationDuration={1500}
                animationBegin={0}
              />
              {/* Other lines */}
              <Line
                type="monotone"
                dataKey="realIncome"
                stroke="#10b981"
                name="Real Personal Income (YoY)"
                strokeWidth={2}
                dot={false}
                connectNulls
                animationDuration={1500}
                animationBegin={300}
              />
              <Line
                type="monotone"
                dataKey="retailSales"
                stroke="#3b82f6"
                name="Retail Sales (YoY)"
                strokeWidth={2}
                dot={false}
                connectNulls
                animationDuration={1500}
                animationBegin={600}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      }
      
      // Default multi-line chart
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={currentData} key={animationKey}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatValue(value, currentIndicator.valueType)}
            />
            <Tooltip content={<GroupedTooltip indicator={currentIndicator} />} />
            <Legend />
            {currentIndicator.series.map((series, index) => (
              <Line
                key={series.dataKey}
                type="monotone"
                dataKey={series.dataKey}
                stroke={series.color}
                name={series.name}
                strokeWidth={2}
                dot={false}
                connectNulls
                animationDuration={1500}
                animationBegin={index * 300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    // Dual-axis chart
    if (currentIndicator.isDualAxis) {
      if (currentIndicator.chartType === 'dual-bar-line') {
        // GDP & Corporate Profits
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={currentData} key={animationKey}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<GroupedTooltip indicator={currentIndicator} />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey={currentIndicator.leftAxis.dataKey} 
                fill={currentIndicator.leftAxis.color}
                name={currentIndicator.leftAxis.label}
                animationDuration={1500}
                animationBegin={0}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey={currentIndicator.rightAxis.dataKey} 
                stroke={currentIndicator.rightAxis.color}
                name={currentIndicator.rightAxis.label}
                strokeWidth={2}
                dot={false}
                animationDuration={1500}
                animationBegin={500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      } else if (currentIndicator.id === 'MONEY_SUPPLY') {
        // Money Supply & Money Market Funds with purple shaded area for M2
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={currentData} key={animationKey}>
              <defs>
                <linearGradient id="m2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="mmfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                label={{ value: 'Growth Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(1)}T`}
                label={{ value: 'Assets (Trillions)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-800 mb-2">
                          {new Date(label).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        {payload.map((entry, index) => {
                          let displayValue;
                          if (entry.dataKey.includes('YOY')) {
                            displayValue = `${entry.value?.toFixed(1)}%`;
                          } else {
                            displayValue = `$${entry.value?.toFixed(2)}T`;
                          }
                          return (
                            <p key={index} style={{ color: entry.color }} className="text-sm">
                              {entry.name}: {displayValue}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              
              {/* YoY Growth Lines (Left Axis) */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="M2_YOY" 
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="M2 Growth (YoY %)"
                animationDuration={1500}
                animationBegin={0}
                connectNulls={true}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="MMF_YOY" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="MMF Growth (YoY %)"
                animationDuration={1500}
                animationBegin={300}
                connectNulls={true}
              />
              
              {/* Absolute Values - M2 first as backdrop, MMF as component */}
              {/* M2 Supply - Purple shaded area showing total money supply */}
              <Area
                yAxisId="right"
                type="monotone" 
                dataKey="M2_ABSOLUTE" 
                stroke="#8b5cf6"
                fill="url(#m2Gradient)"
                strokeWidth={2}
                name="M2 Supply ($T)"
                animationDuration={1500}
                animationBegin={600}
                connectNulls={true}
              />
              {/* MMF Assets - Overlay area showing component of M2 */}
              <Area
                yAxisId="right"
                type="monotone" 
                dataKey="MONEY_MARKET_FUNDS" 
                stroke="#3b82f6"
                fill="url(#mmfGradient)"
                strokeWidth={2}
                name="MMF Assets ($T)"
                opacity={0.6}
                animationDuration={1500}
                animationBegin={900}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      } else if (currentIndicator.id === 'HOUSING') {
        // Housing Market Indicators - Case-Shiller Index (line) and Home Sales (bars)
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={currentData} key={animationKey}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value?.toFixed(0)}
                label={{ value: 'Home Price Index', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value?.toFixed(0)}k`}
                label={{ value: 'Home Sales (000s)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-800 mb-2">
                          {new Date(label).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        {payload.map((entry, index) => {
                          let displayValue;
                          if (entry.dataKey === 'SPCS20RSA') {
                            displayValue = entry.value?.toFixed(2);
                          } else if (entry.dataKey === 'EXHOSLUSM495S') {
                            displayValue = `${entry.value?.toFixed(0)}k`;
                          }
                          return (
                            <p key={index} style={{ color: entry.color }} className="text-sm">
                              {entry.name}: {displayValue}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              
              {/* Case-Shiller Index - Line */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="SPCS20RSA" 
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Case-Shiller 20-City Index"
                animationDuration={1500}
                animationBegin={0}
                connectNulls={true}
              />
              
              {/* Existing Home Sales - Bars */}
              <Bar 
                yAxisId="right"
                dataKey="EXHOSLUSM495S" 
                fill="#10b981"
                name="Existing Home Sales (000s)"
                animationDuration={1500}
                animationBegin={300}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      }
    }
    
    // Area chart for single indicators (like leading indicators)
    if (currentIndicator.chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={currentData} key={animationKey}>
            <defs>
              <linearGradient id={`gradient-${currentIndicator.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentIndicator.color || '#3b82f6'} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={currentIndicator.color || '#3b82f6'} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatValue(value, currentIndicator.valueType)}
            />
            <Tooltip 
              formatter={(value) => formatValue(value, currentIndicator.valueType)}
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={currentIndicator.color || '#3b82f6'}
              fill={`url(#gradient-${currentIndicator.id})`}
              strokeWidth={2}
              animationDuration={currentIndicator.animationDuration || 1500}
              animationBegin={0}
            />
            {/* Add threshold line if exists */}
            {currentIndicator.threshold !== undefined && (
              <Line
                type="monotone"
                dataKey={() => currentIndicator.threshold}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Threshold"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    // Default line chart with animation
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={currentData} key={animationKey}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatValue(value, currentIndicator.valueType)}
          />
          <Tooltip 
            formatter={(value) => formatValue(value, currentIndicator.valueType)}
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={currentIndicator.color || '#3b82f6'}
            strokeWidth={2}
            dot={false}
            animationDuration={1500}
            animationBegin={0}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div className={`bg-white rounded-lg transition-all duration-300 ${isAnimating ? 'opacity-90' : 'opacity-100'}`}>
      {/* Header with title and navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous indicator"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentIndicator.title}
          </h3>
          <button
            onClick={goNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next indicator"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Latest values display */}
        <div className="flex gap-4 flex-wrap">
          {latestValues?.map((val, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className="text-sm text-gray-600">{val.name}:</span>
              <span className="font-semibold" style={{ color: val.color }}>
                {val.isComposite ? val.value : formatValue(val.value, currentIndicator.valueType)}
              </span>
              {!val.isComposite && val.value !== null && val.value !== undefined && (
                <>
                  {val.value > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">
        {currentIndicator.description}
      </p>
      
      {/* Chart */}
      {renderChart()}
      
      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {indicators.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-blue-600 w-8' : 'bg-gray-300'
            }`}
            aria-label={`Go to indicator ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MacroIndicatorCarousel;

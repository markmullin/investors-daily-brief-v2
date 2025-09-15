import React, { useState } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Bar
} from 'recharts';
import EducationIcon from './AI/EducationIcon';
import AnalysisDropdown from './AI/AnalysisDropdown';

/**
 * Custom component to render the candlestick body and wick
 */
const CustomCandlestick = (props) => {
  const { x, y, width, height, fill, payload, index } = props;
  
  // Extract OHLC data
  const open = payload.open || 0;
  const close = payload.close || 0;
  const high = payload.high || 0;
  const low = payload.low || 0;
  
  // Calculate positions
  const isIncreasing = close > open;
  const color = isIncreasing ? '#22c55e' : '#ef4444'; // green for up, red for down
  const strokeWidth = Math.max(1, width * 0.05); // Ensure wick is visible
  const candleWidth = Math.max(2, width * 0.7); // Ensure candle is visible
  
  // Scale values to chart coordinates
  const yHigh = y + height * (1 - (high - min) / (max - min));
  const yLow = y + height * (1 - (low - min) / (max - min));
  const yOpen = y + height * (1 - (open - min) / (max - min));
  const yClose = y + height * (1 - (close - min) / (max - min));
  
  // Use y values directly if they're already scaled
  const hasInvalidValues = isNaN(yHigh) || isNaN(yLow) || isNaN(yOpen) || isNaN(yClose);
  if (hasInvalidValues) {
    // Fallback to a basic bar for this data point
    return (
      <rect
        x={x - candleWidth / 2}
        y={y}
        width={candleWidth}
        height={height}
        fill={color}
        opacity={0.5}
      />
    );
  }
  
  return (
    <g>
      {/* Vertical wick line from high to low */}
      <line
        x1={x}
        y1={yHigh}
        x2={x}
        y2={yLow}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      
      {/* Body rectangle from open to close */}
      <rect
        x={x - candleWidth / 2}
        y={isIncreasing ? yClose : yOpen}
        width={candleWidth}
        height={Math.max(1, Math.abs(yOpen - yClose))}
        fill={color}
      />
    </g>
  );
};

/**
 * Custom tooltip component for candlestick charts
 */
const CandlestickTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{label ? new Date(label).toLocaleDateString() : ''}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <p className="text-gray-600">Open:</p>
          <p className="font-semibold">${data.open?.toFixed(2)}</p>
          
          <p className="text-gray-600">High:</p>
          <p className="font-semibold">${data.high?.toFixed(2)}</p>
          
          <p className="text-gray-600">Low:</p>
          <p className="font-semibold">${data.low?.toFixed(2)}</p>
          
          <p className="text-gray-600">Close:</p>
          <p className={`font-semibold ${data.close >= data.open ? 'text-green-500' : 'text-red-500'}`}>
            ${data.close?.toFixed(2)}
          </p>
          
          {data.volume && (
            <>
              <p className="text-gray-600">Volume:</p>
              <p className="font-semibold">{data.volume.toLocaleString()}</p>
            </>
          )}
          
          {data.ma200 && (
            <>
              <p className="text-gray-600">MA 200:</p>
              <p className="font-semibold">${data.ma200.toFixed(2)}</p>
            </>
          )}
          
          {data.rsi && (
            <>
              <p className="text-gray-600">RSI:</p>
              <p className={`font-semibold ${
                data.rsi >= 70 ? 'text-red-500' : (data.rsi <= 30 ? 'text-green-500' : 'text-gray-700')
              }`}>
                {data.rsi.toFixed(1)}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Candlestick chart component with optional RSI indicator
 */
const CandlestickChart = ({ 
  data, 
  width = '100%', 
  height = 400, 
  showRsi = true,
  showVolume = false,
  showMa = true,
  rsiHeight = 80
}) => {
  const [analysisDropdown, setAnalysisDropdown] = useState({
    isOpen: false,
    position: { top: 0, left: 0 }
  });

  // Handle education analysis requests
  const handleEducationAnalysis = async (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setAnalysisDropdown({
      isOpen: true,
      position: {
        top: rect.bottom,
        left: rect.left + rect.width / 2
      }
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }
  
  // Calculate min/max for price scaling
  const allHighs = data.map(d => d.high).filter(v => v !== undefined && !isNaN(v));
  const allLows = data.map(d => d.low).filter(v => v !== undefined && !isNaN(v));
  const ma200Values = data.map(d => d.ma200).filter(v => v !== undefined && !isNaN(v));
  
  const min = Math.min(...allLows, ...ma200Values);
  const max = Math.max(...allHighs, ...ma200Values);
  
  // Add padding to domain
  const padding = (max - min) * 0.05;
  const domain = [min - padding, max + padding];
  
  // Format date for x-axis
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  
  // Calculate main chart height
  const mainChartHeight = showRsi ? height - rsiHeight : height;
  
  // Format tooltip data
  const formatTooltipValue = (value, name) => {
    if (name === 'volume') return [value.toLocaleString(), 'Volume'];
    if (name === 'rsi') return [value.toFixed(1), 'RSI'];
    return [`$${value.toFixed(2)}`, name];
  };
  
  return (
    <div className="w-full relative" style={{ height }}>
      {/* Chart Header with Education Icon */}
      <div className="absolute top-2 right-2 z-10">
        <EducationIcon
          context="candlestick_chart"
          data={{ chartData: data, indicators: { showRsi, showMa, showVolume } }}
          onAnalysisRequest={handleEducationAnalysis}
          className="bg-white bg-opacity-90 rounded-full p-1"
        />
      </div>
      <div style={{ height: mainChartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            syncId="financialChart"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              interval={Math.floor(data.length / 8)} 
              tick={{ fontSize: 11, fill: '#666' }}
            />
            <YAxis 
              domain={domain}
              tickFormatter={(val) => `$${val.toFixed(0)}`}
              tick={{ fontSize: 11, fill: '#666' }}
              width={55}
            />
            <Tooltip content={<CandlestickTooltip />} />
            <Legend />
            
            {/* Bar component to act as placeholder for candlesticks */}
            <Bar
              dataKey="high"
              name="Price"
              barSize={data.length > 60 ? 3 : 6}
              fill="transparent"
              shape={<CustomCandlestick min={domain[0]} max={domain[1]} />}
            />
            
            {/* Moving Average */}
            {showMa && (
              <Line
                type="monotone"
                dataKey="ma200"
                stroke="#8884d8"
                dot={false}
                name="MA 200"
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* RSI Chart */}
      {showRsi && (
        <div style={{ height: rsiHeight, marginTop: '1px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
              syncId="financialChart"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" hide={true} />
              <YAxis 
                domain={[0, 100]} 
                ticks={[0, 30, 50, 70, 100]}
                tick={{ fontSize: 10, fill: '#666' }}
                width={35}
              />
              <Tooltip formatter={formatTooltipValue} />
              
              {/* Reference lines for overbought/oversold */}
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
              
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#2563eb"
                dot={false}
                name="RSI"
                strokeWidth={1.5}
              />
              <Legend verticalAlign="top" height={20} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Analysis Dropdown */}
      <AnalysisDropdown
        isOpen={analysisDropdown.isOpen}
        onClose={() => setAnalysisDropdown({ isOpen: false, position: { top: 0, left: 0 } })}
        context="candlestick_chart"
        data={{ chartData: data, indicators: { showRsi, showMa, showVolume } }}
        position={analysisDropdown.position}
      />
    </div>
  );
};

export default CandlestickChart;
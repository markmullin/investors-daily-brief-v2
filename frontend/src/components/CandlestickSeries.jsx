import React from 'react';

/**
 * Renders a series of candlestick elements on a chart
 */
const CandlestickSeries = ({ data, xScale, yScale, width, height }) => {
  if (!data || data.length === 0) return null;
  
  // Configure candlestick appearance
  const candleWidth = Math.max(2, Math.min(10, width / data.length * 0.7));
  
  return (
    <g className="candlestick-series">
      {data.map((d, i) => {
        if (!d || typeof d.open !== 'number' || typeof d.close !== 'number' ||
            typeof d.high !== 'number' || typeof d.low !== 'number') {
          return null;
        }
        
        // Determine if price increased or decreased
        const isIncreasing = d.close >= d.open;
        
        // Calculate position
        const x = xScale(i);
        const openY = yScale(d.open);
        const closeY = yScale(d.close);
        const highY = yScale(d.high);
        const lowY = yScale(d.low);
        
        // Set color based on price direction
        const color = isIncreasing ? '#22c55e' : '#ef4444';
        
        // Draw the candlestick
        return (
          <g key={`candle-${i}`} className="candlestick">
            {/* High-low wick line */}
            <line
              x1={x}
              y1={highY}
              x2={x}
              y2={lowY}
              stroke={color}
              strokeWidth={1}
            />
            
            {/* Open-close body rectangle */}
            <rect
              x={x - candleWidth / 2}
              y={isIncreasing ? closeY : openY}
              width={candleWidth}
              height={Math.max(1, Math.abs(openY - closeY))}
              fill={color}
              stroke={color}
            />
          </g>
        );
      })}
    </g>
  );
};

export default CandlestickSeries;
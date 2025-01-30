import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';

const CustomBar = (props) => {
  const { x, y, width, height, fill, payload } = props;
  const radius = 4;
  
  // Determine color based on value
  const barColor = payload.change_p >= 0 ? '#22c55e' : '#ef4444';  // green-500 for positive, red-500 for negative
  
  // For negative values, adjust x and width to draw from the center
  const adjustedX = payload.change_p < 0 ? x + width : x;
  const adjustedWidth = Math.abs(width);
  
  return (
    <g>
      <rect
        x={adjustedX}
        y={y}
        width={adjustedWidth}
        height={height}
        fill={barColor}
        rx={radius}
        ry={radius}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{data.name}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={data.change_p >= 0 ? "text-green-500" : "text-red-500"}>
            {data.change_p >= 0 ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
          </span>
          <span className={data.change_p >= 0 ? "text-green-500" : "text-red-500"}>
            {data.change_p.toFixed(2)}%
          </span>
        </div>
        <p className="text-gray-600 mt-1">${data.close.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const CustomXAxis = (props) => {
  const { x, y, payload } = props;
  const value = parseFloat(payload.value).toFixed(1);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280">
        {value}%
      </text>
    </g>
  );
};

const SectorBarChart = ({ data }) => {
  // Sort data by performance
  const sortedData = [...data].sort((a, b) => b.change_p - a.change_p);

  // Calculate domain for X axis to be symmetrical and rounded
  const maxAbs = Math.max(...sortedData.map(d => Math.abs(d.change_p)));
  const roundedMax = Math.ceil(maxAbs);
  const domain = [-roundedMax, roundedMax];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 20 }}
          barSize={20}
        >
          <XAxis 
            type="number" 
            domain={domain}
            tick={<CustomXAxis />}
            ticks={[-roundedMax, -roundedMax/2, 0, roundedMax/2, roundedMax]}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: '#6B7280' }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="change_p" 
            shape={<CustomBar />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SectorBarChart;
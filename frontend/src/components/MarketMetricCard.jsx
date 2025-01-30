import React, { useState, useMemo } from 'react';  // Changed this line
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';  // Added XAxis
import InfoTooltip from './InfoTooltip';

function MarketMetricCard({ data, historicalData, description }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format historical data for the chart
  const chartData = useMemo(() => {
    if (!Array.isArray(historicalData)) {
      console.log('historicalData is not an array:', historicalData);
      return [];
    }
    
    return historicalData
      .filter(item => item.price !== 0)
      .map(item => ({
        date: new Date(item.date).toISOString().split('T')[0],
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
      }));
  }, [historicalData]);

  const getDisplayName = (rawSymbol) => {
    const shortSymbol = rawSymbol.replace('.US', '');
    switch (shortSymbol) {
      case 'SPY':
        return 'S&P 500';
      case 'QQQ':
        return 'Nasdaq 100';
      case 'DIA':
        return 'Dow Jones';
      case 'IWM':
        return 'Russell 2000';
      default:
        return rawSymbol;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg transition-all duration-300 ease-in-out
        ${isExpanded ? 'md:col-span-2 md:row-span-2' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-6">
        {/* Header / Title / Price */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {getDisplayName(data.symbol)}
              </h3>
              <span className="text-sm text-gray-500">({data.symbol})</span>
              <InfoTooltip content={description} />
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                ${Number(data.close || 0).toFixed(2)}
              </span>
              <div className="flex items-center gap-1">
                {Number(data.change_p) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={`text-lg font-semibold ${
                    Number(data.change_p) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {Math.abs(Number(data.change_p || 0)).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="h-16 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.slice(-30)}>
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={Number(data.change_p) >= 0 ? '#22c55e' : '#ef4444'}
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                  />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={Number(data.change_p) >= 0 ? '#22c55e' : '#ef4444'}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>{description}</p>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-400 flex items-center gap-1">
          <TrendingUp size={14} />
          <span>Click to {isExpanded ? 'collapse' : 'expand'} details</span>
        </div>
      </div>
    </div>
  );
}

export default MarketMetricCard;
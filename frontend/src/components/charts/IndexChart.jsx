import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import EducationIcon from '../AI/EducationIcon';
import AnalysisDropdown from '../AI/AnalysisDropdown';

/**
 * IndexChart Component - Market index charts with 50-day and 200-day moving averages
 * Displays price action with proper MA overlays based on timeframe
 */
const IndexChart = ({ symbol, name, height = 300 }) => {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('1M'); // Default to 1 month
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [analysisDropdown, setAnalysisDropdown] = useState({
    isOpen: false,
    position: { top: 0, left: 0 }
  });

  // Calculate moving average
  const calculateMA = (data, period) => {
    return data.map((item, index) => {
      if (index < period - 1) return { ...item, [`ma${period}`]: null };
      
      const sum = data
        .slice(index - period + 1, index + 1)
        .reduce((acc, curr) => acc + curr.price, 0);
      
      return { ...item, [`ma${period}`]: parseFloat((sum / period).toFixed(2)) };
    });
  };

  // Fetch and process chart data
  const fetchChartData = async () => {
    try {
      setLoading(true);
      
      // Generate sample data based on timeframe
      const dataPoints = getDataPointsForTimeframe(timeframe);
      let mockData = generateMockData(symbol, dataPoints);
      
      // Add moving averages based on timeframe
      if (timeframe === '1D' || timeframe === '1W') {
        // Short timeframes: Only 20-day MA
        mockData = calculateMA(mockData, 20);
      } else if (timeframe === '1M' || timeframe === '3M') {
        // Medium timeframes: 20 & 50-day MA
        mockData = calculateMA(mockData, 20);
        mockData = calculateMA(mockData, 50);
      } else {
        // Long timeframes (6M, 1Y, 5Y): 50 & 200-day MA
        mockData = calculateMA(mockData, 50);
        mockData = calculateMA(mockData, 200);
      }
      
      setChartData(mockData);
      
      // Calculate statistics
      const prices = mockData.map(d => d.price);
      const currentPrice = prices[prices.length - 1];
      const startPrice = prices[0];
      const change = ((currentPrice - startPrice) / startPrice) * 100;
      
      setStats({
        current: currentPrice,
        change: change,
        high: Math.max(...prices),
        low: Math.min(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length
      });
      
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get number of data points based on timeframe
  const getDataPointsForTimeframe = (tf) => {
    switch(tf) {
      case '1D': return 78; // 5-min intervals
      case '1W': return 35; // Hourly
      case '1M': return 22; // Daily
      case '3M': return 65; // Daily
      case '6M': return 130; // Daily
      case '1Y': return 252; // Daily
      case '5Y': return 260; // Weekly
      default: return 22;
    }
  };

  // Generate mock data for demonstration
  const generateMockData = (symbol, points) => {
    const basePrice = getBasePrice(symbol);
    const volatility = symbol === 'BTCUSD' ? 0.03 : 0.008;
    const trend = 0.0002;
    
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < points; i++) {
      const date = new Date(now);
      
      // Calculate date based on timeframe
      if (timeframe === '1D') {
        date.setMinutes(date.getMinutes() - (points - i) * 5);
      } else if (timeframe === '1W') {
        date.setHours(date.getHours() - (points - i) * 4);
      } else if (timeframe === '5Y') {
        date.setDate(date.getDate() - (points - i) * 7);
      } else {
        date.setDate(date.getDate() - (points - i));
      }
      
      const randomChange = (Math.random() - 0.5) * volatility;
      const trendComponent = trend * i;
      const price = basePrice * (1 + randomChange + trendComponent);
      
      data.push({
        date: formatDate(date, timeframe),
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
    }
    
    return data;
  };

  // Get base price for symbol
  const getBasePrice = (symbol) => {
    const prices = {
      '^GSPC': 6200,
      '^IXIC': 20000,
      '^DJI': 44000,
      '^RUT': 2300,
      'BTCUSD': 65000
    };
    return prices[symbol] || 5000;
  };

  // Format date based on timeframe
  const formatDate = (date, tf) => {
    if (tf === '1D') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (tf === '1W') {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    } else if (tf === '5Y') {
      return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const price = payload.find(p => p.dataKey === 'price');
      const ma20 = payload.find(p => p.dataKey === 'ma20');
      const ma50 = payload.find(p => p.dataKey === 'ma50');
      const ma200 = payload.find(p => p.dataKey === 'ma200');
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {price && (
            <p className="text-sm mt-1">
              Price: <span className="font-semibold">${price.value.toLocaleString()}</span>
            </p>
          )}
          {ma20 && ma20.value && (
            <p className="text-xs text-blue-600">MA20: ${ma20.value.toLocaleString()}</p>
          )}
          {ma50 && ma50.value && (
            <p className="text-xs text-green-600">MA50: ${ma50.value.toLocaleString()}</p>
          )}
          {ma200 && ma200.value && (
            <p className="text-xs text-purple-600">MA200: ${ma200.value.toLocaleString()}</p>
          )}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[300px] bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  // Determine which MAs to show based on timeframe
  const showMA20 = timeframe === '1D' || timeframe === '1W' || timeframe === '1M' || timeframe === '3M';
  const showMA50 = timeframe === '1M' || timeframe === '3M' || timeframe === '6M' || timeframe === '1Y' || timeframe === '5Y';
  const showMA200 = timeframe === '6M' || timeframe === '1Y' || timeframe === '5Y';

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

  return (
    <div className="space-y-4 relative">
      {/* Header with Chart Title and Education Icon */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{name} Technical Analysis</h3>
        <EducationIcon
          context="technical_indicators"
          data={{ symbol, chartData, stats, timeframe }}
          onAnalysisRequest={handleEducationAnalysis}
          className="ml-2"
        />
      </div>
      
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-1">
            {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            {stats.change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={stats.change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {stats.change >= 0 ? '+' : ''}{stats.change?.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            domain={['dataMin - 100', 'dataMax + 100']}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="line"
            wrapperStyle={{ fontSize: '12px' }}
          />
          
          {/* Price Line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#374151"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name="Price"
          />
          
          {/* Moving Averages based on timeframe */}
          {showMA20 && (
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="MA20"
            />
          )}
          
          {showMA50 && (
            <Line
              type="monotone"
              dataKey="ma50"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="MA50"
            />
          )}
          
          {showMA200 && (
            <Line
              type="monotone"
              dataKey="ma200"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              name="MA200"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Moving Average Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 px-2">
        {showMA20 && (
          <div className="flex items-center space-x-1">
            <div className="w-8 h-0.5 bg-blue-500" style={{ borderStyle: 'dashed', borderWidth: '1px 0 0 0', borderColor: '#3b82f6' }}></div>
            <span>20-Day MA</span>
          </div>
        )}
        {showMA50 && (
          <div className="flex items-center space-x-1">
            <div className="w-8 h-0.5" style={{ borderStyle: 'dashed', borderWidth: '1px 0 0 0', borderColor: '#10b981' }}></div>
            <span>50-Day MA</span>
          </div>
        )}
        {showMA200 && (
          <div className="flex items-center space-x-1">
            <div className="w-8 h-0.5" style={{ borderStyle: 'dashed', borderWidth: '2px 0 0 0', borderColor: '#8b5cf6' }}></div>
            <span>200-Day MA</span>
          </div>
        )}
        <div className="text-gray-400 ml-auto">
          Volume bars hidden for clarity
        </div>
      </div>

      {/* Analysis Dropdown */}
      <AnalysisDropdown
        isOpen={analysisDropdown.isOpen}
        onClose={() => setAnalysisDropdown({ isOpen: false, position: { top: 0, left: 0 } })}
        context="technical_indicators"
        data={{ symbol, chartData, stats, timeframe }}
        position={analysisDropdown.position}
      />
    </div>
  );
};

export default IndexChart;
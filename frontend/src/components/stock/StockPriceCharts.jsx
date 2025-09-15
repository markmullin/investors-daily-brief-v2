import React from 'react';
import { AlertCircle } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Area, ComposedChart, Bar 
} from 'recharts';

/**
 * Custom tooltip component for financial data
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Format display date based on whether it's intraday or daily data
    let displayDate = '';
    if (data.originalDate) {
      const date = new Date(data.originalDate);
      if (data.isIntraday) {
        displayDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else {
        displayDate = date.toLocaleDateString();
      }
    }
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{displayDate}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <p className="text-gray-600">Price:</p>
          <p className="font-semibold">${Number(data.price || data.close).toFixed(2)}</p>
          
          {data.volume !== undefined && data.volume !== null && data.volume > 0 && (
            <>
              <p className="text-gray-600">Volume:</p>
              <p className="font-semibold">{Number(data.volume).toLocaleString()}</p>
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

const StockPriceCharts = ({ 
  historicalData, 
  loading, 
  selectedPeriod, 
  safeStock 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('📊 [CHART_COMPONENT] Raw historical data:', {
    length: historicalData.length,
    firstPoint: historicalData[0],
    lastPoint: historicalData[historicalData.length - 1],
    selectedPeriod,
    sampleDates: historicalData.slice(0, 3).map(d => d.date)
  });

  // ✅ FIXED: Process historical data to preserve time information for intraday
  const processedHistoricalData = historicalData
    .filter(item => item && item.isDisplayed !== false)
    .map((item, index) => {
      const originalDate = item.date;
      const dateObj = new Date(originalDate);
      
      // Determine if this is intraday data based on time component
      const isIntraday = selectedPeriod === '1d' || selectedPeriod === '5d' || 
                        (dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || dateObj.getSeconds() !== 0);
      
      // Format chart key based on data type
      let chartKey;
      if (isIntraday) {
        // For intraday: keep timestamp as-is for proper chart ordering
        chartKey = originalDate;
      } else {
        // For daily: use date only
        chartKey = dateObj.toISOString().split('T')[0];
      }
      
      return {
        ...item,
        chartKey, // Used for chart X-axis
        originalDate, // Preserve original for tooltip
        isIntraday,
        price: typeof item.price === 'number' ? item.price : 
               (typeof item.close === 'number' ? item.close : null),
        ma200: typeof item.ma200 === 'number' ? item.ma200 : null,
        rsi: typeof item.rsi === 'number' ? item.rsi : null,
        volume: typeof item.volume === 'number' ? item.volume : 0
      };
    })
    .filter(item => item.price !== null);

  console.log('📊 [CHART_COMPONENT] Processed data:', {
    length: processedHistoricalData.length,
    firstPoint: processedHistoricalData[0],
    lastPoint: processedHistoricalData[processedHistoricalData.length - 1],
    isIntraday: processedHistoricalData[0]?.isIntraday,
    chartKeys: processedHistoricalData.slice(0, 5).map(d => d.chartKey)
  });

  // Chart calculations
  const visibleDataPoints = processedHistoricalData;
  const hasMa200 = visibleDataPoints.some(item => item.ma200 !== null && item.ma200 !== undefined);
  const hasRsi = visibleDataPoints.some(item => item.rsi !== null && item.rsi !== undefined);
  const hasVolume = visibleDataPoints.some(item => item.volume && item.volume > 0);
  const hasData = visibleDataPoints.length > 0;
  const isIntradayData = visibleDataPoints.length > 0 && visibleDataPoints[0]?.isIntraday;
  
  // Hide RSI and MA200 for intraday periods
  const showRSI = selectedPeriod !== '1d' && selectedPeriod !== '5d' && hasRsi;
  const showMA200 = selectedPeriod !== '1d' && selectedPeriod !== '5d' && hasMa200;
  const showVolume = hasVolume;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
        <AlertCircle className="text-red-500 mb-4" size={40} />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Historical Data Available</h3>
        <p className="text-gray-600 text-center max-w-md">
          Historical data for {safeStock.symbol} could not be loaded.
          <br />
          Please check API connectivity.
        </p>
      </div>
    );
  }

  // Calculate Y-axis domains
  const calculatePriceDomain = () => {
    if (!visibleDataPoints || visibleDataPoints.length === 0) {
      return [0, 100];
    }
    
    const prices = visibleDataPoints.map(d => Number(d.price)).filter(p => !isNaN(p) && p > 0);
    const ma200Values = showMA200 ? 
      visibleDataPoints.map(d => Number(d.ma200)).filter(p => !isNaN(p) && p > 0) : 
      [];
    
    const allValues = [...prices, ...ma200Values];
    if (allValues.length === 0) return [0, 100];
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    const range = maxValue - minValue;
    const padding = range * 0.05;
    
    return [Math.max(0, minValue - padding), maxValue + padding];
  };

  const calculateVolumeDomain = () => {
    if (!showVolume || !visibleDataPoints || visibleDataPoints.length === 0) {
      return [0, 1000000];
    }
    
    const volumes = visibleDataPoints.map(d => Number(d.volume)).filter(v => !isNaN(v) && v > 0);
    if (volumes.length === 0) return [0, 1000000];
    
    const maxVolume = Math.max(...volumes);
    return [0, maxVolume * 0.3];
  };

  const [domainMin, domainMax] = calculatePriceDomain();
  const [volumeMin, volumeMax] = calculateVolumeDomain();

  // Chart dimensions
  const volumeChartHeight = showVolume ? 30 : 0;
  const mainChartHeight = 320 - volumeChartHeight;
  const rsiChartHeight = 140;
  const totalHeight = mainChartHeight + volumeChartHeight + (showRSI ? rsiChartHeight + 20 : 0) + (showVolume ? 3 : 0);

  // Line color based on change
  const getLineColor = () => {
    return Number(safeStock.change_p) >= 0 ? '#22c55e' : '#ef4444';
  };

  // Volume bar color based on price change
  const getVolumeColor = (item, index) => {
    if (index === 0) return '#9ca3af';
    const prevPrice = visibleDataPoints[index - 1]?.price || item.price;
    return item.price >= prevPrice ? '#22c55e' : '#ef4444';
  };

  // ✅ FIXED: Format date to show proper time labels for intraday data
  const formatDate = (chartKey) => {
    if (!chartKey) return '';
    try {
      if (isIntradayData && (selectedPeriod === '1d' || selectedPeriod === '5d')) {
        // For intraday data, show time only for 1D, date+time for 5D
        const d = new Date(chartKey);
        if (selectedPeriod === '1d') {
          return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        } else {
          return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
      } else {
        // For daily data, show dates
        const d = new Date(chartKey);
        if (selectedPeriod === '5y') {
          return `${d.getMonth() + 1}/${d.getFullYear()}`;
        } else {
          return `${d.getMonth() + 1}/${d.getDate()}`;
        }
      }
    } catch (e) {
      console.error('Date formatting error:', e, chartKey);
      return '';
    }
  };

  // Calculate appropriate tick interval for X-axis
  const getTickInterval = () => {
    if (selectedPeriod === '1d' && isIntradayData) {
      // For 1D intraday, show every 6th tick (roughly hourly for 5-min data)
      return Math.floor(Math.max(1, visibleDataPoints.length / 6));
    } else {
      return Math.floor(Math.max(1, visibleDataPoints.length / 8));
    }
  };

  return (
    <div style={{ height: totalHeight }} className="mt-4">
      {/* Main Price Chart */}
      <div style={{ height: mainChartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={visibleDataPoints} 
            margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
            syncId="stockCharts"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="chartKey"
              tickFormatter={formatDate}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={{ stroke: '#e0e0e0' }}
              interval={getTickInterval()}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
              axisLine={{ stroke: '#e0e0e0' }}
              tick={{ fill: '#666666', fontSize: 11 }}
              tickLine={{ stroke: '#e0e0e0' }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Price Line */}
            <Line
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
            
            {/* MA200 Line */}
            {showMA200 && (
              <Line
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
              height={36} 
              content={(props) => {
                const { payload } = props;
                return (
                  <div className="flex justify-center gap-8 text-xs mt-1">
                    {payload.map((entry, index) => (
                      <div key={`item-${index}`} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3" 
                          style={{ 
                            backgroundColor: entry.dataKey === 'price' ? getLineColor() : '#6366f1',
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
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Volume Chart */}
      {showVolume && (
        <div style={{ height: volumeChartHeight, marginTop: '1px' }}>
          <div className="mb-0 text-xs font-medium text-gray-400 px-3" style={{ fontSize: '10px' }}>Vol</div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={visibleDataPoints} 
              margin={{ top: 0, right: 15, left: 15, bottom: 0 }}
              syncId="stockCharts"
            >
              <XAxis 
                dataKey="chartKey" 
                hide={true}
                interval={getTickInterval()}
              />
              <YAxis
                domain={[volumeMin, volumeMax]}
                tick={{ fill: '#999999', fontSize: 7 }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                  return '';
                }}
                width={30}
                axisLine={false}
                tickLine={false}
                tickCount={2}
              />
              <Tooltip 
                formatter={(value) => [value?.toLocaleString(), 'Volume']}
                labelFormatter={(label) => formatDate(label)}
              />
              
              <Bar
                dataKey="volume"
                fill="#9ca3af"
                opacity={0.25}
                shape={(props) => {
                  const { x, y, width, height, payload, index } = props;
                  const color = getVolumeColor(payload, index);
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={color}
                      opacity={0.25}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* RSI Chart */}
      {showRSI && (
        <div style={{ height: rsiChartHeight, marginTop: '20px' }}>
          <div className="mb-2 text-sm font-semibold text-gray-700 px-3">RSI (Relative Strength Index)</div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={visibleDataPoints} 
              margin={{ top: 5, right: 15, left: 15, bottom: 25 }}
              syncId="stockCharts"
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
                dataKey="chartKey"
                tickFormatter={formatDate}
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={{ stroke: '#e0e0e0' }}
                interval={getTickInterval()}
                height={25}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 30, 50, 70, 100]}
                axisLine={{ stroke: '#e0e0e0' }}
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#e0e0e0' }}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              
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
                  fontSize: 12,
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
                  fontSize: 12,
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
                strokeWidth={3}
                name="RSI"
                isAnimationActive={false}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Debug information for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p>Debug Info:</p>
          <p>Period: {selectedPeriod} | Data Points: {visibleDataPoints.length}</p>
          <p>Has MA200: {hasMa200.toString()} | Has RSI: {hasRsi.toString()} | Has Volume: {hasVolume.toString()}</p>
          <p>Show MA200: {showMA200.toString()} | Show RSI: {showRSI.toString()} | Show Volume: {showVolume.toString()}</p>
          <p>Is Intraday: {isIntradayData.toString()}</p>
          <p>First chart key: {visibleDataPoints[0]?.chartKey} | Last: {visibleDataPoints[visibleDataPoints.length - 1]?.chartKey}</p>
        </div>
      )}
    </div>
  );
};

export default StockPriceCharts;
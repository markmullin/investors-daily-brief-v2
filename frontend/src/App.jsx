import { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, AlertCircle, TrendingUp } from 'lucide-react';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { GraduationCap } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import SectorRotation from './components/SectorRotation';
import SectorBarChart from './components/SectorBarChart';
import SearchBar from './components/SearchBar';
import StockModal from './components/StockModal';
import InfoTooltip from './components/InfoTooltip';
import { marketApi } from './services/api';
import MarketThemes from './components/MarketThemes';
import KeyInsights from './components/KeyInsights';
import MarketEnvironment from './components/MarketEnvironment';
import IndustryAnalysis from './components/IndustryAnalysis/IndustryAnalysis';
import MacroAnalysis from './components/MacroAnalysis/MacroAnalysis';
import { MonitoringProvider } from './context/MonitoringContext';
import MonitoringDisplay from './components/MonitoringDisplay';

function ViewToggle() {
  const { viewMode, setViewMode } = useViewMode();

  const handleBasicClick = () => {
    console.log('Switching to basic view');
    setViewMode('basic');
  };

  const handleAdvancedClick = () => {
    console.log('Switching to advanced view');
    setViewMode('advanced');
  };

  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
      <button
        onClick={handleBasicClick}
        className={`flex items-center gap-1 px-3 py-1.5 rounded ${viewMode === 'basic'
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600'
          } transition-all duration-200`}
      >
        <GraduationCap size={16} />
        <span>Basic View</span>
      </button>
      <button
        onClick={handleAdvancedClick}
        className={`flex items-center gap-1 px-3 py-1.5 rounded ${viewMode === 'advanced'
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600'
          } transition-all duration-200`}
      >
        <TrendingUp size={16} />
        <span>Advanced View</span>
      </button>
    </div>
  );
}

function MarketMetricCard({ data, historicalData, description }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { viewMode } = useViewMode();

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

  const chartData = useMemo(() => {
    if (!Array.isArray(historicalData)) {
      console.log('historicalData is not an array:', historicalData);
      return [];
    }

    return historicalData
      .filter(item => item.price !== 0)
      .map(item => ({
        date: new Date(item.date).toISOString().split('T')[0],
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        ma200: typeof item.ma200 === 'number' ? item.ma200 : null
      }));
  }, [historicalData]);

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
              <InfoTooltip
                basicContent={description.basic}
                advancedContent={description.advanced}
              />
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
                  className={`text-lg font-semibold ${Number(data.change_p) >= 0 ? 'text-green-500' : 'text-red-500'
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
                    formatter={(value, name) => {
                      if (name === 'price') return [`$${Number(value).toFixed(2)}`, 'Price'];
                      if (name === 'ma200') return [`$${Number(value).toFixed(2)}`, '200-day MA'];
                      return [value, name];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={Number(data.change_p) >= 0 ? '#22c55e' : '#ef4444'}
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ma200"
                    stroke="#dc2626"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="200-day MA"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-sm text-gray-600">
              <p>{viewMode === 'basic' ? description.basic : description.advanced}</p>
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

function App() {
  // State Management
  const [marketData, setMarketData] = useState([]);
  const [macroData, setMacroData] = useState({});
  const [marketMover, setMarketMover] = useState(null);
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [historicalPrices, setHistoricalPrices] = useState({});

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch main sets of data
        const [market, macro, mover, sectors] = await Promise.all([
          marketApi.getData(),
          marketApi.getMacro(),
          marketApi.getMover(),
          marketApi.getSectors()
        ]);

        console.log('Received mover data:', mover);

        // Convert object to array
        const marketArray = Object.entries(market).map(([symbol, info]) => ({
          symbol,
          ...info
        }));
        setMarketData(marketArray);
        setMacroData(macro);
        setSectorData(sectors);

        // Update market mover data properly
        if (mover && mover.symbol) {
          const moverHistory = await marketApi.getHistory(mover.symbol, 12);

          setMarketMover({
            symbol: mover.symbol,
            companyName: mover.companyName || mover.symbol,
            price: mover.price || 0,
            changePercent: mover.changePercent || 0,
            dailyChange: parseFloat(((mover.price || 0) * (mover.changePercent || 0) / 100).toFixed(2)),
            reason: `${mover.symbol} moved ${(mover.changePercent || 0) >= 0 ? 'up' : 'down'} ${Math.abs(Number(mover.changePercent || 0)).toFixed(2)}%`,
            history: moverHistory.map(day => ({
              ...day,
              ma200: day.ma200 || null
            })),
            // Ensure these fields exist for tooltips
            basicInsight: mover.basicInsight || null,
            advancedInsight: mover.advancedInsight || null,
            volumeAnalysis: mover.volumeAnalysis || null,
            technicalLevels: mover.technicalLevels || null,
            marketImpact: mover.marketImpact || null
          });

          console.log('Set market mover state');
        } else {
          console.log('No valid mover data received');
          setMarketMover(null);
        }

        // Fetch historical data for indices
        const indices = ['SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US'];
        const histories = {};
        for (const sym of indices) {
          try {
            const hist = await marketApi.getHistory(sym, 6);  // 6 months of data
            histories[sym] = hist;
          } catch (err) {
            console.error(`Error fetching history for ${sym}:`, err);
            histories[sym] = [];
          }
        }

        console.log('Fetched historical data:', histories);
        setHistoricalPrices(histories);
        setError(null);
      } catch (error) {
        console.error('Data fetching error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Search Handler
  const handleSearch = async (symbol) => {
    try {
      const [stockData, historyData] = await Promise.all([
        marketApi.getQuote(symbol),
        marketApi.getHistory(symbol)
      ]);

      setSelectedStock(stockData);
      setStockHistory(historyData);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch stock data');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Filter main indices
  const mainIndices = marketData.filter((item) =>
    ['SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US'].includes(item.symbol)
  );

  console.log('mainIndices =>', mainIndices);
  console.log('historicalPrices =>', historicalPrices);

  return (
    <ViewModeProvider>
      <MonitoringProvider>
        <div className="p-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-bold" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
              Investor's Daily Brief
            </h1>
            <div className="flex items-center gap-4">
              <ViewToggle />
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Key Insights Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Key Market Insights</h2>
            <KeyInsights />
          </section>

          {/* Market Monitoring Section */}
          <section className="mb-8">
            <MonitoringDisplay />
          </section>

          <div className="space-y-8">
            {/* Market Metrics Section */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[...mainIndices]
                  .sort((a, b) => {
                    const order = {
                      'SPY.US': 1,
                      'QQQ.US': 2,
                      'DIA.US': 3,
                      'IWM.US': 4
                    };
                    return order[a.symbol] - order[b.symbol];
                  })
                  .map((data) => {
                    const histData = historicalPrices[data.symbol] || [];
                    return (
                      <MarketMetricCard
                        key={data.symbol}
                        data={data}
                        description={
                          data.symbol.includes('SPY') ? {
                            basic: "The S&P 500 tracks the 500 biggest US companies. It's the main way to measure how the US stock market is doing.",
                            advanced: "The S&P 500 is the benchmark US equity index with market-cap weighting across 11 sectors. Key technical signals include the 50/200-day moving averages and volume trends."
                          } : data.symbol.includes('QQQ') ? {
                            basic: "The Nasdaq 100 follows the largest tech companies like Apple and Microsoft. Shows how tech stocks are performing.",
                            advanced: "The Nasdaq 100 tracks major non-financial companies, heavily weighted toward technology. Higher volatility with strong growth orientation."
                          } : data.symbol.includes('DIA') ? {
                            basic: "The Dow Jones tracks 30 major US companies. It's the oldest and most well-known market indicator.",
                            advanced: "The DJIA is price-weighted across 30 blue-chip stocks. Less representative than S&P 500 but historically significant benchmark."
                          } : data.symbol.includes('IWM') ? {
                            basic: "The Russell 2000 follows smaller US companies. These often show early signs of economic changes.",
                            advanced: "The Russell 2000 represents small-cap US equities. Higher volatility, strong economic sensitivity, historically leads market cycles."
                          } : data.symbol
                        }
                        historicalData={histData}
                      />
                    );
                  })}
              </div>
            </section>

            {/* Market Environment Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Environment</h2>
              <MarketEnvironment />
            </section>

            {/* Performance Section */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Sector Performance</h2>
              <div className="bg-white p-6 rounded-lg shadow">
                <SectorBarChart data={sectorData} />
              </div>
            </section>

            {/* Sector Rotation Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Sector Rotation Analysis</h2>
              <SectorRotation />
            </section>

            <section>
              <div className="mb-8">
                <IndustryAnalysis />
              </div>
            </section>

            {/* Macro Analysis Section */}
            <section>
              <div className="mb-8">
                <MacroAnalysis />
              </div>
            </section>

            {/* Market Mover Section */}
            <section>
              {marketMover && (
                <div className="col-span-4 bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-gray-600 flex items-center gap-2">
                      Market Mover: {marketMover.symbol}
                      <InfoTooltip
                        basicContent={
                          `${marketMover.symbol} is making significant moves today. ${marketMover.basicInsight || `Current price: $${marketMover.price?.toFixed(2) || 'N/A'} (${marketMover.changePercent >= 0 ? '+' : ''}${marketMover.changePercent?.toFixed(2) || 0}%).`} This move represents a notable shift in market sentiment${marketMover.companyName ? ' for ' + marketMover.companyName : ''}.`
                        }
                        advancedContent={
                          `${marketMover.symbol} Technical Analysis: ${marketMover.advancedInsight?.trim() || 'Price momentum shows significant deviation from normal trading range.'} ${marketMover.volumeAnalysis?.trim() || `Trading volume is ${Math.abs(marketMover.changePercent) > 5 ? 'elevated' : 'normal'} relative to average.`} Support: $${(marketMover.price * 0.95).toFixed(2)}, Resistance: $${(marketMover.price * 1.05).toFixed(2)}. ${marketMover.marketImpact?.trim() || `Market impact is ${Math.abs(marketMover.changePercent) > 7 ? 'significant' : 'moderate'} with potential sector-wide implications.`}`
                        }
                      />
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold">
                        ${typeof marketMover.price === 'number' ? marketMover.price.toFixed(2) : '0.00'}
                      </p>
                      <div className="flex items-center gap-2">
                        {(marketMover.changePercent || 0) >= 0 ? (
                          <ArrowUp className="text-green-500" size={20} />
                        ) : (
                          <ArrowDown className="text-red-500" size={20} />
                        )}
                        <span className={
                          (marketMover.changePercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                        }>
                          {Math.abs(Number(marketMover.changePercent || 0)).toFixed(2)}%
                          {' '}
                          (${Math.abs(Number((marketMover.price || 0) * (marketMover.changePercent || 0) / 100)).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">
                    {marketMover.symbol} moved {(marketMover.changePercent || 0) >= 0 ? 'up' : 'down'} {Math.abs(Number(marketMover.changePercent || 0)).toFixed(2)}%
                  </p>
                  {marketMover.history && marketMover.history.length > 0 && (
                    <div className="h-40 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={marketMover.history}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(date) => {
                              if (!date) return '';
                              const d = new Date(date);
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
                          />
                          <Tooltip
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            formatter={(value, name) => {
                              if (name === 'price') return [`$${Number(value).toFixed(2)}`, 'Price'];
                              if (name === 'ma200') return [`$${Number(value).toFixed(2)}`, '200-day MA'];
                              return [value, name];
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#2563eb"
                            dot={false}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="ma200"
                            stroke="#dc2626"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            dot={false}
                            name="200-day MA"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Stock Search Modal */}
          <StockModal
            isOpen={selectedStock !== null}
            onClose={() => setSelectedStock(null)}
            stock={selectedStock}
          />
        </div>
      </MonitoringProvider>
    </ViewModeProvider>
  );
}

export default App;
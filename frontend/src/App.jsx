import { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, AlertCircle, TrendingUp } from 'lucide-react';
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

function MarketMetricCard({ data, historicalData, description }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
            price: mover.price,
            changePercent: mover.changePercent,  // Use direct values from mover data
            dailyChange: parseFloat((mover.price * mover.changePercent / 100).toFixed(2)),  // Calculate daily change
            reason: `${mover.symbol} moved ${mover.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(Number(mover.changePercent)).toFixed(2)}%`,
            history: moverHistory.map(day => ({
              ...day,
              ma200: day.ma200 || null
            }))
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
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
          Investor's Daily Brief
        </h1>
        <SearchBar onSearch={handleSearch} />
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
                      data.symbol.includes('SPY') ? "S&P 500 tracks the performance of the 500 largest US companies."
                        : data.symbol.includes('QQQ') ? "Nasdaq 100 represents the largest non-financial companies listed on the Nasdaq."
                          : data.symbol.includes('DIA') ? "Dow Jones Industrial Average follows 30 prominent companies listed on US stock exchanges."
                            : data.symbol.includes('IWM') ? "Russell 2000 measures the performance of 2000 smaller US companies."
                              : data.symbol
                    }
                    historicalData={histData}
                  />
                );
              })}
          </div>
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

        {/* Macroeconomic Environment Section */}
        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Macroeconomic Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* TLT Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                Treasury Bonds (TLT)
                <InfoTooltip content="Treasury bonds are considered a key indicator of economic health and monetary policy. Rising TLT suggests flight to safety..." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.tlt?.price === 'number' ? macroData.tlt.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.tlt?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={
                    (macroData.tlt?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {typeof macroData.tlt?.change === 'number' ? macroData.tlt.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* UUP Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                US Dollar (UUP)
                <InfoTooltip content="The US Dollar Index ETF measures the dollar's strength against major global currencies. Dollar strength impacts global trade..." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.uup?.price === 'number' ? macroData.uup.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.uup?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={
                    (macroData.uup?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {typeof macroData.uup?.change === 'number' ? macroData.uup.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* USO Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                Oil Fund (USO)
                <InfoTooltip content="Tracks crude oil. High oil can raise inflation & transport costs, affecting consumer spending..." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.uso?.price === 'number' ? macroData.uso.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.uso?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={
                    (macroData.uso?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {typeof macroData.uso?.change === 'number' ? macroData.uso.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* GLD Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                Gold (GLD)
                <InfoTooltip content="Gold has historically been viewed as a store of value and hedge against uncertainty. Strong gold prices often reflect inflation concerns..." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.gld?.price === 'number' ? macroData.gld.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.gld?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={
                    (macroData.gld?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {typeof macroData.gld?.change === 'number' ? macroData.gld.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* VIX Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                VIX Index
                <InfoTooltip content="Wall Street's 'fear gauge'. High VIX => big swings, risk-off environment..." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.vix?.price === 'number' ? macroData.vix.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.vix?.change || 0) >= 0 ? (
                  <ArrowUp className="text-red-500" size={20} />
                ) : (
                  <ArrowDown className="text-green-500" size={20} />
                )}
                <span
                  className={
                    (macroData.vix?.change || 0) >= 0 ? 'text-red-500' : 'text-green-500'
                  }
                >
                  {typeof macroData.vix?.change === 'number' ? macroData.vix.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* EEM Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                Emerging Markets (EEM)
                <InfoTooltip content="A gauge of global growth & risk appetite, especially in developing economies." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.eem?.price === 'number' ? macroData.eem.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.eem?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={
                    (macroData.eem?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {typeof macroData.eem?.change === 'number' ? macroData.eem.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* IBIT Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                Bitcoin ETF (IBIT)
                <InfoTooltip content="The first spot Bitcoin ETF tracking the cryptocurrency market." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.ibit?.price === 'number' ? macroData.ibit.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.ibit?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={
                    (macroData.ibit?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {typeof macroData.ibit?.change === 'number' ? macroData.ibit.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* JNK Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                High Yield Bonds (JNK)
                <InfoTooltip content="Tracks high-yield corporate bonds. A gauge of risk appetite and credit conditions." />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.jnk?.price === 'number' ? macroData.jnk.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.jnk?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span
                  className={
                    (macroData.jnk?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {typeof macroData.jnk?.change === 'number' ? macroData.jnk.change.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* Market Mover Card (UPDATED) */}
            {marketMover && (
              <div className="col-span-4 bg-white p-4 rounded-lg shadow">
                <h3 className="text-gray-600 mb-2 flex items-center gap-2">
                  Market Mover: {marketMover.symbol}
                  <InfoTooltip content="Significant stock making notable moves today." />
                </h3>
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
                        {Math.abs(Number(marketMover.changePercent)).toFixed(2)}%
                        {' '}
                        (${Math.abs(Number(marketMover.price * marketMover.changePercent / 100)).toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">
                  {marketMover.symbol} moved {marketMover.changePercent >= 0 ? 'up' : 'down'} {Math.abs(Number(marketMover.changePercent || 0)).toFixed(2)}%
                </p>
                {marketMover.history && marketMover.history.length > 0 && (
                  <div className="h-40 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={marketMover.history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => {
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
          </div>
        </section>
      </div>

      {/* Stock Search Modal */}
      <StockModal
        isOpen={selectedStock !== null}
        onClose={() => setSelectedStock(null)}
        stock={selectedStock}
      />
    </div>
  );
}

export default App;

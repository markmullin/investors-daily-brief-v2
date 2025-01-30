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
              <LineChart data={chartData}>
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

function App() {
  // ---------------------- STATE ----------------------
  const [marketData, setMarketData] = useState([]);
  const [macroData, setMacroData] = useState({});
  const [marketMover, setMarketMover] = useState(null);
  const [moverHistory, setMoverHistory] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rotationData, setRotationData] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [historicalPrices, setHistoricalPrices] = useState({});

  // ---------------------- DATA FETCH ----------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Fetch main sets of data
        const [market, macro, mover, sectors] = await Promise.all([
          marketApi.getData(),
          marketApi.getMacro(),
          marketApi.getMover(),
          marketApi.getSectors()
        ]);

        // Convert object => array
        const marketArray = Object.entries(market).map(([symbol, info]) => ({
          symbol,
          ...info
        }));
        setMarketData(marketArray);

        // macros, mover, sectors
        setMacroData(macro);
        setMarketMover({
          symbol: mover.symbol,
          price: mover.price,
          changePercent: mover.changePercent,
          reason: mover.reason
        });
        setMoverHistory(mover.history || []);
        setSectorData(sectors);

        // With this updated version:
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------- SEARCH ----------------------
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

  // ---------------------- LOADING STATE ----------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // mainIndices => we focus on .US tickers
  const mainIndices = marketData.filter((item) =>
    ['SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US'].includes(item.symbol)
  );

  console.log('mainIndices =>', mainIndices);
  console.log('historicalPrices =>', historicalPrices);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
          Investor's Daily Brief
        </h1>
        <SearchBar onSearch={handleSearch} />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Key Market Insights</h2>
        <KeyInsights />
      </section>

      <div className="space-y-8">

        {/* MARKET METRICS */}
        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {mainIndices.map((data) => {
              // e.g. data.symbol === "DIA.US"
              const histData = historicalPrices[data.symbol] || [];

              return (
                <MarketMetricCard
                  key={data.symbol}
                  data={data}
                  description={
                    data.symbol.includes('SPY') ? "S&P 500..."
                    : data.symbol.includes('QQQ') ? "Nasdaq 100..."
                    : data.symbol.includes('DIA') ? "Dow Jones Industrial Average..."
                    : data.symbol.includes('IWM') ? "Russell 2000..."
                    : data.symbol
                  }
                  historicalData={histData}
                />
              );
            })}
          </div>
        </section>

        {/* SECTOR PERFORMANCE */}
        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Sector Performance</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <SectorBarChart data={sectorData} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Sector Rotation Analysis</h2>
          <SectorRotation />
        </section>

        {/* MACRO ENVIRONMENT */}
        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Macroeconomic Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* TLT Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                Treasury Bonds (TLT)
                <InfoTooltip content={
                  "Treasury bonds are considered a key indicator of economic health and monetary policy. Rising TLT suggests flight to safety..."
                } />
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
                <span className={
                  (macroData.tlt?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.tlt?.change === 'number'
                    ? macroData.tlt.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>

            {/* UUP Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                US Dollar (UUP)
                <InfoTooltip content={
                  "The US Dollar Index ETF measures the dollar's strength against major global currencies. Dollar strength impacts global trade..."
                } />
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
                <span className={
                  (macroData.uup?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.uup?.change === 'number'
                    ? macroData.uup.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>

            {/* GLD Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                Gold (GLD)
                <InfoTooltip content={
                  "Gold has historically been viewed as a store of value and hedge against uncertainty. Strong gold prices often reflect inflation concerns..."
                } />
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
                <span className={
                  (macroData.gld?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.gld?.change === 'number'
                    ? macroData.gld.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>

            {/* VIX Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                Volatility (VIX)
                <InfoTooltip content={
                  "Wall Street's 'fear gauge'. High VIX => big swings, risk-off environment..."
                } />
              </h3>
              <p className="text-2xl font-bold">
                ${typeof macroData.vix?.price === 'number' ? macroData.vix.price.toFixed(2) : '0.00'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(macroData.vix?.change || 0) >= 0 ? (
                  <ArrowUp className="text-green-500" size={20} />
                ) : (
                  <ArrowDown className="text-red-500" size={20} />
                )}
                <span className={
                  (macroData.vix?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.vix?.change === 'number'
                    ? macroData.vix.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>

            {/* USO Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                Oil Fund (USO)
                <InfoTooltip content={
                  "Tracks crude oil. High oil can raise inflation & transport costs, affecting consumer spending..."
                } />
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
                <span className={
                  (macroData.uso?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.uso?.change === 'number'
                    ? macroData.uso.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>

            {/* EEM Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                Emerging Markets (EEM)
                <InfoTooltip content={
                  "A gauge of global growth & risk appetite, especially in developing economies."
                } />
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
                <span className={
                  (macroData.eem?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.eem?.change === 'number'
                    ? macroData.eem.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>

            {/* IBIT Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                Bitcoin ETF (IBIT)
                <InfoTooltip content={
                  "Reflects mainstream adoption of crypto markets, risk appetite in alternative assets."
                } />
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
                <span className={
                  (macroData.ibit?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.ibit?.change === 'number'
                    ? macroData.ibit.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>

            {/* JNK Card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-600 mb-2 flex items-center">
                High Yield Bonds (JNK)
                <InfoTooltip content={
                  "Tracks 'junk' bonds. If JNK is strong, markets are risk-on and seeking higher yields in riskier credit."
                } />
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
                <span className={
                  (macroData.jnk?.change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }>
                  {typeof macroData.jnk?.change === 'number'
                    ? macroData.jnk.change.toFixed(2)
                    : '0.00'}
                  %
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Themes</h2>
          <MarketThemes />
        </section>

        {/* MARKET MOVER + 200DAY MA */}
        {marketMover && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <TrendingUp className="text-blue-500" />
              Top Market Mover
              <InfoTooltip content={
                "Shows the most significant daily mover in the S&P 500, with 6-month history + a 200-day MA for trend analysis."
              } />
            </h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {marketMover.symbol}
                  </h3>
                  <p className="text-3xl font-bold">
                    ${Number(marketMover.price).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {Number(marketMover.changePercent) >= 0 ? (
                      <ArrowUp className="text-green-500" size={24} />
                    ) : (
                      <ArrowDown className="text-red-500" size={24} />
                    )}
                    <span
                      className={
                        Number(marketMover.changePercent) >= 0
                          ? 'text-green-500 text-xl'
                          : 'text-red-500 text-xl'
                      }
                    >
                      {Number(marketMover.changePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="max-w-2xl">
                  <p className="text-gray-600 text-lg">{marketMover.reason}</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moverHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      formatter={(value, name) => {
                        if (name === 'price') {
                          return [`$${value.toFixed(2)}`, 'Price'];
                        }
                        if (name === 'ma200') {
                          return [`$${value.toFixed(2)}`, '200-day MA'];
                        }
                        return [value, name];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      name="price"
                    />
                    <Line
                      type="monotone"
                      dataKey="ma200"
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      name="ma200"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}
      </div>

      {selectedStock && (
        <StockModal
          stock={selectedStock}
          historicalData={stockHistory}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}

export default App;

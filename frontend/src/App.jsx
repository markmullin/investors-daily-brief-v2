import { useState, useEffect, lazy, Suspense } from 'react';
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { marketApi } from './services/api';

// Lazy load heavy components
const SectorPerformanceNew = lazy(() => import('./components/SectorPerformanceNew'));
const SearchBar = lazy(() => import('./components/SearchBar'));
const StockModal = lazy(() => import('./components/StockModal'));
const MarketThemes = lazy(() => import('./components/MarketThemes'));
const AIInsights = lazy(() => import('./components/AIInsights')); // 🚀 UPDATED: New AI-powered insights
const KeyRelationships = lazy(() => import('./components/KeyRelationships'));
const MacroeconomicCarousel = lazy(() => import('./components/MacroeconomicCarousel'));
const NewsTicker = lazy(() => import('./components/NewsTicker'));
const TourButton = lazy(() => import('./components/TourButton'));
const MarketMetricsCarousel = lazy(() => import('./components/MarketMetricsCarousel'));
const PortfolioTracker = lazy(() => import('./components/PortfolioTracker'));

// Risk Positioning System
const RiskPositioningDashboard = lazy(() => import('./components/RiskPositioning/RiskPositioningDashboard'));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

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
    <div className="flex gap-0.5">
      <button
        onClick={handleBasicClick}
        className={`px-3 py-1.5 text-sm ${viewMode === 'basic'
          ? 'text-gray-800 font-medium'
          : 'text-gray-600'
          } transition-all duration-200`}
      >
        Basic
      </button>
      <button
        onClick={handleAdvancedClick}
        className={`px-3 py-1.5 text-sm ${viewMode === 'advanced'
          ? 'text-gray-800 font-medium'
          : 'text-gray-600'
          } transition-all duration-200`}
      >
        Advanced
      </button>
    </div>
  );
}

function App() {
  // State Management
  const [marketData, setMarketData] = useState([]);
  const [sp500Data, setSp500Data] = useState([]);
  const [macroData, setMacroData] = useState({});
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [historicalPrices, setHistoricalPrices] = useState({});
  const [relationshipData, setRelationshipData] = useState({});
  
  // User context for personalized risk insights
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);

  // Check for user authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data.user);
            setUserId(data.user.id);
          }
        } catch (error) {
          console.log('User not authenticated');
        }
      }
    };
    
    checkAuth();
  }, []);

  // Optimized Data Fetching with batch requests
  useEffect(() => {
    const fetchData = async () => {
      const startTime = performance.now();
      
      try {
        // Fetch basic data in parallel
        const [market, sp500, macro, sectors] = await Promise.all([
          marketApi.getData(),
          marketApi.getSP500Top(),
          marketApi.getMacro(),
          marketApi.getSectors()
        ]);

        // Process market data
        const marketArray = Array.isArray(market) ? 
          market.map(stock => ({
            symbol: stock.symbol,
            close: stock.price,
            change_p: stock.changePercent,
            name: stock.name,
            volume: stock.volume
          })) : [];
          
        setMarketData(marketArray);

        // Process S&P 500 data
        const sp500Array = Array.isArray(sp500) ? 
          sp500.map(stock => ({
            symbol: stock.symbol,
            close: stock.price,
            change_p: stock.changePercent,
            name: stock.name,
            volume: stock.volume || 0
          })) : [];
          
        setSp500Data(sp500Array);
        setMacroData(macro);
        
        // Process sectors
        const mappedSectors = Array.isArray(sectors) ?
          sectors.map(sector => ({
            symbol: sector.symbol,
            name: sector.name,
            color: sector.color || '#1e40af',
            close: sector.price,
            change_p: sector.changePercent,
            changePercent: sector.changePercent,
            price: sector.price
          })) : [];
          
        setSectorData(mappedSectors);

        // Batch fetch all historical data at once
        const allSymbols = [
          // Main indices
          'SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US',
          // Relationship symbols
          'TLT.US', 'EEM.US', 'EFA.US', 'IVE.US', 'IVW.US',
          'IBIT.US', 'GLD.US', 'BND.US', 'JNK.US', 'USO.US', 'UUP.US',
          'XLP.US', 'XLY.US', 'SMH.US', 'XSW.US'
        ];

        console.log('Fetching batch historical data for', allSymbols.length, 'symbols');
        
        // Use batch API for all historical data
        const batchHistorical = await marketApi.getBatchHistory(allSymbols, '1y');
        
        // Process batch results
        const histories = {};
        const relationshipHistories = {};
        
        for (const [symbol, result] of Object.entries(batchHistorical)) {
          const historyData = { 
            data: result.error ? [] : result.data, 
            period: '1y' 
          };
          
          // Add to main indices
          if (['SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US'].includes(symbol)) {
            histories[symbol] = historyData;
          }
          
          // Add to relationship data
          relationshipHistories[symbol] = historyData;
        }
        
        setHistoricalPrices(histories);
        setRelationshipData(relationshipHistories);

        const endTime = performance.now();
        console.log(`Data fetching completed in ${(endTime - startTime).toFixed(2)}ms`);
        
        setError(null);
      } catch (error) {
        console.error('Data fetching error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Search Handler
  const handleSearch = async (symbol) => {
    try {
      const stockData = await marketApi.getQuote(symbol);
      setSelectedStock(stockData);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch stock data');
      setSelectedStock(null);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Filter main indices
  const mainIndices = marketData.filter((item) =>
    ['SPY', 'QQQ', 'DIA', 'IWM'].includes(item.symbol)
  );

  return (
    <ViewModeProvider>
      <div className="min-h-screen flex flex-col">
        {/* News Ticker */}
        <Suspense fallback={<div className="h-8 bg-gray-100"></div>}>
          <NewsTicker />
        </Suspense>
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="w-full flex items-center gap-4">
            <h1 className="text-2xl font-bold whitespace-nowrap" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
              Investor's Daily Brief
            </h1>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-5xl">
              <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg"></div>}>
                <SearchBar onSearch={handleSearch} />
              </Suspense>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              <ViewToggle />
              <Suspense fallback={<div className="w-20 h-8"></div>}>
                <TourButton />
              </Suspense>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* 🚀 AI-Powered Financial Insights Section - PREMIER POSITION */}
          <section className="mb-8">
            <Suspense fallback={
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading AI market insights...</span>
                </div>
              </div>
            }>
              <AIInsights />
            </Suspense>
          </section>

          <div className="space-y-8">
            {/* Market Metrics Section */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Metrics</h2>
              <Suspense fallback={<LoadingSpinner />}>
                <MarketMetricsCarousel 
                  indices={mainIndices} 
                  historicalData={historicalPrices} 
                />
              </Suspense>
            </section>

            {/* Sector Performance Section */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Sector Performance</h2>
              <Suspense fallback={<LoadingSpinner />}>
                <SectorPerformanceNew initialSectorData={sectorData} />
              </Suspense>
            </section>

            {/* Key Relationships Section */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Key Relationships</h2>
              <Suspense fallback={<LoadingSpinner />}>
                <KeyRelationships 
                  historicalData={relationshipData} 
                  sectorData={sectorData}
                />
              </Suspense>
            </section>

            {/* Macroeconomic Analysis Section */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Macroeconomic Environment</h2>
              <Suspense fallback={<LoadingSpinner />}>
                <MacroeconomicCarousel />
              </Suspense>
            </section>

            {/* 🎯 MOVED: Market Risk Positioning - Now positioned above Portfolio Analytics */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-700 flex items-center">
                🎯 Market Risk Positioning
                <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  FIXED
                </span>
              </h2>
              <Suspense fallback={
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading risk positioning system...</span>
                  </div>
                </div>
              }>
                <RiskPositioningDashboard 
                  userId={userId}
                  userProfile={userProfile}
                />
              </Suspense>
            </section>

            {/* Portfolio Tracker Section - Now below Risk Positioning */}
            <section>
              <Suspense fallback={<LoadingSpinner />}>
                <PortfolioTracker />
              </Suspense>
            </section>
          </div>

          {/* Stock Search Modal */}
          <Suspense fallback={null}>
            <StockModal
              isOpen={selectedStock !== null}
              onClose={() => setSelectedStock(null)}
              stock={selectedStock}
            />
          </Suspense>
        </div>
      </div>
    </ViewModeProvider>
  );
}

export default App;
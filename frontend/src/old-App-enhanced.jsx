import React, { lazy, Suspense } from 'react';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { MarketDataProvider, useMarketData, useMarketDataSection } from './context/MarketDataContext';
import { DataSection, GlobalRefreshButton } from './components/EnhancedErrorBoundary';
import { 
  MarketMetricSkeleton, 
  SectorPerformanceSkeleton, 
  KeyInsightsSkeleton,
  RelationshipSkeleton,
  MacroCarouselSkeleton,
  NewsTickerSkeleton
} from './components/SkeletonLoaders';
import { marketApi } from './services/api';

// Lazy load heavy components
const SectorPerformanceNew = lazy(() => import('./components/SectorPerformanceNew'));
const SearchBar = lazy(() => import('./components/SearchBar'));
const StockModal = lazy(() => import('./components/StockModal'));
const MarketThemes = lazy(() => import('./components/MarketThemes'));
const KeyInsights = lazy(() => import('./components/KeyInsights'));
const KeyRelationships = lazy(() => import('./components/KeyRelationships'));
const MacroeconomicCarousel = lazy(() => import('./components/MacroeconomicCarousel'));
const NewsTicker = lazy(() => import('./components/NewsTicker'));
const TourButton = lazy(() => import('./components/TourButton'));
const MarketMetricsCarousel = lazy(() => import('./components/MarketMetricsCarousel'));
const PortfolioTracker = lazy(() => import('./components/PortfolioTracker'));

function ViewToggle() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="flex gap-0.5">
      <button
        onClick={() => setViewMode('basic')}
        className={`px-3 py-1.5 text-sm ${viewMode === 'basic'
          ? 'text-gray-800 font-medium'
          : 'text-gray-600'
          } transition-all duration-200`}
      >
        Basic
      </button>
      <button
        onClick={() => setViewMode('advanced')}
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

// Enhanced search handler
function SearchSection() {
  const [selectedStock, setSelectedStock] = React.useState(null);

  const handleSearch = async (symbol) => {
    try {
      const stockData = await marketApi.getQuote(symbol);
      setSelectedStock(stockData);
    } catch (error) {
      console.error('Search error:', error);
      setSelectedStock(null);
    }
  };

  return (
    <>
      <div className="flex-1 max-w-5xl">
        <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>}>
          <SearchBar onSearch={handleSearch} />
        </Suspense>
      </div>
      
      <Suspense fallback={null}>
        <StockModal
          isOpen={selectedStock !== null}
          onClose={() => setSelectedStock(null)}
          stock={selectedStock}
        />
      </Suspense>
    </>
  );
}

function DashboardContent() {
  const { 
    isAnyLoading, 
    hasAnyError, 
    refreshAllData,
    mainIndices,
    historicalPrices,
    relationshipData,
    sectorData
  } = useMarketData();

  // Section-specific data hooks
  const marketDataSection = useMarketDataSection('marketData');
  const sectorDataSection = useMarketDataSection('sectorData');
  const macroDataSection = useMarketDataSection('macroData');
  const historicalDataSection = useMarketDataSection('historicalData');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced News Ticker with loading state */}
      <DataSection
        sectionName="News"
        loading={false} // News ticker loads independently
        loadingSkeleton={<NewsTickerSkeleton />}
      >
        <Suspense fallback={<NewsTickerSkeleton />}>
          <NewsTicker />
        </Suspense>
      </DataSection>
      
      {/* Header with global refresh */}
      <header className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="w-full flex items-center gap-4">
          <h1 className="text-2xl font-bold whitespace-nowrap" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
            Investor's Daily Brief
          </h1>
          
          <SearchSection />
          
          <div className="flex items-center gap-3 whitespace-nowrap">
            <GlobalRefreshButton 
              onRefresh={refreshAllData}
              isRefreshing={isAnyLoading}
            />
            <ViewToggle />
            <Suspense fallback={<div className="w-20 h-8 bg-gray-100 rounded animate-pulse"></div>}>
              <TourButton />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Main Content with enhanced error handling */}
      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="space-y-8">
          {/* Key Insights Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Key Market Insights</h2>
            <DataSection
              sectionName="Key Insights"
              loading={macroDataSection.loading}
              error={macroDataSection.error}
              refreshing={macroDataSection.refreshing}
              onRetry={macroDataSection.retry}
              loadingSkeleton={<KeyInsightsSkeleton />}
            >
              <Suspense fallback={<KeyInsightsSkeleton />}>
                <KeyInsights />
              </Suspense>
            </DataSection>
          </section>

          {/* Market Metrics Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Metrics</h2>
            <DataSection
              sectionName="Market Metrics"
              loading={marketDataSection.loading || historicalDataSection.loading}
              error={marketDataSection.error || historicalDataSection.error}
              refreshing={marketDataSection.refreshing || historicalDataSection.refreshing}
              onRetry={() => {
                marketDataSection.retry();
                historicalDataSection.retry();
              }}
              loadingSkeleton={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <MarketMetricSkeleton key={i} />)}
                </div>
              }
            >
              <Suspense fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <MarketMetricSkeleton key={i} />)}
                </div>
              }>
                <MarketMetricsCarousel 
                  indices={mainIndices} 
                  historicalData={historicalPrices} 
                />
              </Suspense>
            </DataSection>
          </section>

          {/* Sector Performance Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Sector Performance</h2>
            <DataSection
              sectionName="Sector Performance"
              loading={sectorDataSection.loading}
              error={sectorDataSection.error}
              refreshing={sectorDataSection.refreshing}
              onRetry={sectorDataSection.retry}
              loadingSkeleton={<SectorPerformanceSkeleton />}
            >
              <Suspense fallback={<SectorPerformanceSkeleton />}>
                <SectorPerformanceNew initialSectorData={sectorData} />
              </Suspense>
            </DataSection>
          </section>

          {/* Key Relationships Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Key Relationships</h2>
            <DataSection
              sectionName="Key Relationships"
              loading={historicalDataSection.loading}
              error={historicalDataSection.error}
              refreshing={historicalDataSection.refreshing}
              onRetry={historicalDataSection.retry}
              loadingSkeleton={<RelationshipSkeleton />}
            >
              <Suspense fallback={<RelationshipSkeleton />}>
                <KeyRelationships 
                  historicalData={relationshipData} 
                  sectorData={sectorData}
                />
              </Suspense>
            </DataSection>
          </section>

          {/* Macroeconomic Analysis Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Macroeconomic Environment</h2>
            <DataSection
              sectionName="Macroeconomic Analysis"
              loading={macroDataSection.loading}
              error={macroDataSection.error}
              refreshing={macroDataSection.refreshing}
              onRetry={macroDataSection.retry}
              loadingSkeleton={<MacroCarouselSkeleton />}
            >
              <Suspense fallback={<MacroCarouselSkeleton />}>
                <MacroeconomicCarousel />
              </Suspense>
            </DataSection>
          </section>

          {/* Portfolio Tracker Section */}
          <section>
            <DataSection
              sectionName="Portfolio Tracker"
              loading={false} // Portfolio tracker manages its own loading
              error={null}
              refreshing={false}
            >
              <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>}>
                <PortfolioTracker />
              </Suspense>
            </DataSection>
          </section>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ViewModeProvider>
      <MarketDataProvider>
        <DashboardContent />
      </MarketDataProvider>
    </ViewModeProvider>
  );
}

export default App;

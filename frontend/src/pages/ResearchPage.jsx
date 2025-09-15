import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calculator, Building2, GitCompare, BarChart3, Sparkles } from 'lucide-react';
import { marketApi } from '../services/api';

// Lazy load components - REMOVED SimpleStockScreener and related imports
const EnhancedSearchBar = lazy(() => import('../components/EnhancedSearchBar'));
const StockModal = lazy(() => import('../components/StockModal'));
const DCFCalculator = lazy(() => import('../components/DCFCalculator'));
const ComparableAnalysis = lazy(() => import('../components/ComparableAnalysis'));
const CustomIndexBuilder = lazy(() => import('../components/CustomIndexBuilder'));
const DiscoveryHub = lazy(() => import('../components/discovery/DiscoveryHub'));
const ProfessionalWatchlist = lazy(() => import('../components/watchlist/ProfessionalWatchlist'));

/**
 * *** RESEARCH PAGE - CLEANED UP ***
 * 
 * RECENT UPDATES:
 * ✅ Removed Stock Screener section entirely
 * ✅ Clean 4-card AI discovery layout only
 * ✅ Fixed text formatting and overlay issues
 * ✅ Removed redundant AI-Powered Stock Discovery header section
 * 
 * Features:
 * 1. Enhanced Search Bar for stock lookup
 * 2. AI-Powered Stock Discovery (4 cards)
 * 3. Analysis tools (DCF, Comparable Analysis, Index Builder)
 */
const ResearchPage = () => {
  const navigate = useNavigate();
  
  // Main state
  const [searchError, setSearchError] = useState(null);
  const [selectedStocks, setSelectedStocks] = useState([]);
  
  // Modal states for enhanced analysis
  const [showDCFCalculator, setShowDCFCalculator] = useState(false);
  const [showComparableAnalysis, setShowComparableAnalysis] = useState(false);
  const [showIndexBuilder, setShowIndexBuilder] = useState(false);
  const [analysisSymbol, setAnalysisSymbol] = useState('');

  // Stock search handler
  const handleSearch = async (symbol) => {
    try {
      // Validate the stock exists by fetching quote
      await marketApi.getQuote(symbol);
      
      // Navigate to full-page analysis
      navigate(`/research/stock/${symbol.toUpperCase()}`);
      setSearchError(null);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(`Unable to find stock data for "${symbol}". Please verify the symbol and try again.`);
    }
  };

  // Enhanced analysis handlers
  const openDCFCalculator = (symbol = analysisSymbol) => {
    setAnalysisSymbol(symbol);
    setShowDCFCalculator(true);
  };

  const openComparableAnalysis = (symbol = analysisSymbol) => {
    setAnalysisSymbol(symbol);
    setShowComparableAnalysis(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* *** ENHANCED HEADER WITH PROMINENT SEARCH *** */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Research Hub</h1>
              <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-100 to-green-100 rounded-full">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">AI-Powered Discovery + Full-Page Analysis</span>
              </div>
            </div>
            <p className="text-gray-600">Professional-grade stock analysis with AI-powered discovery and intelligent search. Discover investment opportunities without knowing ticker symbols.</p>
          </div>

          {/* *** ENHANCED SEARCH BAR *** */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Search className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Enhanced Search & Full-Page Analysis</span>
              <div className="px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-xs text-blue-700">Smart Suggestions • Full-Page Analysis • Bloomberg Terminal-grade</span>
              </div>
            </div>
            <Suspense fallback={<div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>}>
              <EnhancedSearchBar onSearch={handleSearch} />
            </Suspense>
            {searchError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {searchError}
              </div>
            )}
          </div>

          {/* Quick Analysis Tools */}
          {analysisSymbol && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-blue-900">
                    Professional Analysis for {analysisSymbol}:
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/research/stock/${analysisSymbol}`)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors flex items-center space-x-1"
                  >
                    <BarChart3 className="w-3 h-3" />
                    <span>Full Analysis</span>
                  </button>
                  <button
                    onClick={() => openDCFCalculator()}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>DCF Model</span>
                  </button>
                  <button
                    onClick={() => openComparableAnalysis()}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Peer Analysis</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Stocks for Index Building */}
          {selectedStocks.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-green-900">
                    Selected for index building ({selectedStocks.length}/10):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 text-sm shadow-sm"
                      >
                        <button
                          onClick={() => navigate(`/research/stock/${stock.symbol}`)}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {stock.symbol}
                        </button>
                        <button
                          onClick={() => setSelectedStocks(prev => prev.filter(s => s.symbol !== stock.symbol))}
                          className="text-gray-500 hover:text-red-600 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowIndexBuilder(true)}
                    disabled={selectedStocks.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Build Custom Index</span>
                  </button>
                  <button
                    onClick={() => setSelectedStocks([])}
                    className="text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* *** MAIN CONTENT AREA - CLEAN DISCOVERY HUB ONLY *** */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          
          {/* *** DISCOVERY HUB - NO REDUNDANT HEADER *** */}
          <Suspense fallback={
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading AI-powered discovery experience...</span>
              </div>
            </div>
          }>
            <DiscoveryHub />
          </Suspense>

          {/* *** PROFESSIONAL WATCHLIST - BLOOMBERG TERMINAL QUALITY *** */}
          <Suspense fallback={
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading professional watchlist...</span>
              </div>
            </div>
          }>
            <ProfessionalWatchlist
              initialSymbols={['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM', 'V', 'JNJ']}
              onSymbolClick={(symbol) => navigate(`/research/stock/${symbol}`)}
            />
          </Suspense>

        </div>
      </div>

      {/* *** MODALS *** */}
      
      {/* DCF Calculator Modal */}
      {showDCFCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <DCFCalculator 
              symbol={analysisSymbol}
              onClose={() => setShowDCFCalculator(false)}
            />
          </div>
        </div>
      )}

      {/* Comparable Analysis Modal */}
      {showComparableAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ComparableAnalysis 
              symbol={analysisSymbol}
              onClose={() => setShowComparableAnalysis(false)}
            />
          </div>
        </div>
      )}

      {/* Index Builder Modal */}
      {showIndexBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-lg">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Custom Index Builder</h3>
                <button
                  onClick={() => setShowIndexBuilder(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <CustomIndexBuilder 
                initialHoldings={selectedStocks.map(stock => ({
                  symbol: stock.symbol,
                  name: stock.name,
                  weight: 100 / selectedStocks.length,
                  price: stock.price || 0,
                  marketCap: stock.marketCap || 0,
                  sector: stock.sector || 'Unknown',
                  beta: stock.beta || 1.0,
                  dividendYield: stock.dividendYield || 0,
                  change: stock.change || 0,
                  changePercent: stock.changePercent || 0
                }))}
                onSave={(index) => {
                  console.log('Index saved:', index);
                  setShowIndexBuilder(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchPage;
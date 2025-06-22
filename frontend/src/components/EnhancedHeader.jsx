import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ViewToggle from './ViewToggle';
import TourButton from './TourButton';
import NewsTicker from './NewsTicker';
import { marketApi } from '../services/api';

const EnhancedHeader = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Default search handler if one is not provided by parent
  const defaultSearchHandler = async (symbol) => {
    try {
      console.log('Searching for:', symbol);
      const [stockData, historyData] = await Promise.all([
        marketApi.getQuote(symbol),
        marketApi.getHistory(symbol)
      ]);
      
      // This default handler just returns the data
      // The actual app needs to set up the StockModal to display it
      return { stockData, historyData };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Use the provided onSearch handler or the default one
      await (onSearch || defaultSearchHandler)(searchQuery.trim().toUpperCase());
      
      // Reset search state after successful search
      setSearchQuery('');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="w-full">
      {/* News Ticker - Always Display First */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <NewsTicker />
      </div>
      
      {/* Main Header */}
      <header className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center gap-6">
            {/* Title */}
            <h1 className="text-2xl font-bold whitespace-nowrap flex-shrink-0" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
              Investor's Daily Brief
            </h1>
            
            {/* Search Form - Taking up all available middle space */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search stocks, sectors, or market data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-gray-700 hover:bg-gray-800 text-white rounded-r-md px-6 py-2 text-sm font-medium transition-colors"
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
            
            {/* Controls - Right side with no extra spacing */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <ViewToggle />
              <TourButton />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default EnhancedHeader;
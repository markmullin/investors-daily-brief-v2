import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearching(true);
      onSearch(searchTerm.toUpperCase())
        .finally(() => setIsSearching(false));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search stocks, sectors, or market data..."
          className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <Search 
          className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" 
        />
      </div>
      <button
        type="submit"
        className="px-6 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        disabled={isSearching}
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};

export default SearchBar;
import React from 'react';
import { useViewMode } from '../context/ViewModeContext';

const ViewToggle = () => {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="flex">
      <button
        onClick={() => setViewMode('basic')}
        className={`px-4 py-1.5 text-sm font-medium rounded-l-md border transition-colors ${
          viewMode === 'basic' 
            ? 'bg-gray-200 text-gray-800 border-gray-300' 
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
      >
        Basic
      </button>
      
      <button
        onClick={() => setViewMode('advanced')}
        className={`px-4 py-1.5 text-sm font-medium rounded-r-md border-t border-r border-b transition-colors ${
          viewMode === 'advanced' 
            ? 'bg-gray-200 text-gray-800 border-gray-300' 
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
      >
        Advanced
      </button>
    </div>
  );
};

export default ViewToggle;
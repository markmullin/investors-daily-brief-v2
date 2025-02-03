import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useViewMode } from '../context/ViewModeContext';

const InfoTooltip = ({ basicContent, advancedContent }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { viewMode } = useViewMode();

  return (
    <div className="relative inline-block ml-2">
      <Info
        size={16}
        className="text-gray-400 hover:text-gray-600 cursor-pointer"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className="absolute z-50 w-72 p-4 mt-2 text-sm bg-white rounded-lg shadow-xl border border-gray-100 -left-1/2 transform -translate-x-1/2">
          <div className="text-gray-700">
            {viewMode === 'basic' ? basicContent : advancedContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
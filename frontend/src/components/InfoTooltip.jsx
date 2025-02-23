import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useViewMode } from '../context/ViewModeContext';

const InfoTooltip = ({ basicContent, advancedContent }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { viewMode } = useViewMode();

  // Ensure content has fallbacks
  const getContent = () => {
    if (viewMode === 'basic') {
      return basicContent || "Information not available.";
    } else {
      return advancedContent || "Advanced information not available.";
    }
  };

  return (
    <div className="relative inline-block ml-2">
      <Info
        size={16}
        className="text-gray-400 hover:text-gray-600 cursor-pointer"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 mt-2 text-sm bg-white rounded-lg shadow-xl border border-gray-100 -left-20 top-6">
          <div className="relative">
            {/* Arrow */}
            <div className="absolute -top-6 left-16 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45" />
            {/* Content */}
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {getContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
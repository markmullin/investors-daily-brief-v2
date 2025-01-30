import React, { useState } from 'react';
import { Info } from 'lucide-react';

const InfoTooltip = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <Info
        size={16}
        className="text-gray-400 hover:text-gray-600 cursor-pointer"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className="absolute z-50 w-64 p-4 mt-2 text-sm bg-white rounded-lg shadow-xl border border-gray-100 -left-1/2 transform -translate-x-1/2">
          <div className="text-gray-700">{content}</div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
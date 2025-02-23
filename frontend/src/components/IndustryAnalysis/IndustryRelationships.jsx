import React, { useState } from 'react';
import RelationshipInsights from '../RelationshipAnalysis/RelationshipInsights';
import { AlertCircle } from 'lucide-react';

const IndustryRelationships = ({ industryData }) => {
  const [activeInsight, setActiveInsight] = useState(null);

  const handleInsightHover = (insight) => {
    setActiveInsight(insight);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="relative">
        {activeInsight && (
          <div className="absolute right-0 top-0 bg-blue-50 dark:bg-blue-900/50 p-3 rounded-lg shadow-lg max-w-xs z-10">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-1" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {activeInsight.description}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <RelationshipInsights 
          data={industryData}
          type="industry"
          onInsightHover={handleInsightHover}
        />
      </div>
    </div>
  );
};

export default IndustryRelationships;
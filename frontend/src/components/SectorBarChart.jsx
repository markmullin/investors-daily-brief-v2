import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useViewMode } from '../context/ViewModeContext';
import InfoTooltip from './InfoTooltip';
import EducationIcon from './AI/EducationIcon';
import AnalysisDropdown from './AI/AnalysisDropdown';

/**
 * Sector Bar Chart Component
 * 
 * Displays sector performance data as a horizontal bar chart
 * Now accepts data as props instead of fetching its own
 */
const SectorBarChart = ({ data = [] }) => {
  const { viewMode } = useViewMode();
  const [analysisDropdown, setAnalysisDropdown] = useState({
    isOpen: false,
    position: { top: 0, left: 0 }
  });

  // Sort sectors by performance
  const sortedData = [...data].sort((a, b) => {
    const changeA = b.changePercent || b.change_p || 0;
    const changeB = a.changePercent || a.change_p || 0;
    return changeA - changeB;
  });

  // Find the maximum absolute change for scaling
  const maxChange = Math.max(...sortedData.map(d => Math.abs(d.changePercent || d.change_p || 0)));
  const scale = maxChange > 0 ? 100 / maxChange : 1;

  // Handle education analysis requests
  const handleEducationAnalysis = async (event, { context, data }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setAnalysisDropdown({
      isOpen: true,
      position: {
        top: rect.bottom,
        left: rect.left + rect.width / 2
      }
    });
  };

  return (
    <div className="relative">
      {/* Chart Header with Education Icon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Sector Performance</h3>
        <EducationIcon
          context="sector_rotation"
          data={sortedData}
          onAnalysisRequest={handleEducationAnalysis}
          className="ml-2"
        />
      </div>
      
      {/* Sector Bars */}
      <div className="space-y-3">
      {sortedData.map((sector, index) => {
        const change = sector.changePercent || sector.change_p || 0;
        const isPositive = change > 0;
        const isNegative = change < 0;
        const isNeutral = change === 0;
        
        const barWidth = Math.abs(change) * scale;
        const baseColor = isPositive ? '#22c55e' : (isNegative ? '#ef4444' : '#9ca3af');
        
        // Unique key for each bar
        const uniqueKey = `sector-${sector.symbol}-${index}`;
        
        return (
          <div key={uniqueKey} className="relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 min-w-[140px]">
                  {sector.name || sector.symbol}
                </span>
                {viewMode === 'advanced' && (
                  <InfoTooltip
                    basicContent={`${sector.name} ETF tracks ${sector.name.toLowerCase()} sector companies`}
                    advancedContent={`Symbol: ${sector.symbol}. Current price: $${(sector.price || sector.close)?.toFixed(2) || 'N/A'}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-1">
                {isPositive && <ArrowUp className="w-4 h-4 text-green-500" />}
                {isNegative && <ArrowDown className="w-4 h-4 text-red-500" />}
                {isNeutral && <Minus className="w-4 h-4 text-gray-400" />}
                <span className={`text-sm font-semibold ${
                  isPositive ? 'text-green-600' : (isNegative ? 'text-red-600' : 'text-gray-600')
                }`}>
                  {isPositive && '+'}{change.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="relative w-full bg-gray-100 rounded-sm overflow-hidden h-6">
              <div
                className="absolute inset-y-0 left-0 rounded-sm transition-all duration-300 ease-out"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: baseColor,
                  opacity: 0.9
                }}
              />
            </div>
          </div>
        );
      })}
        </div>
        
        {/* X-axis */}
        <div className="mt-4 border-t pt-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>-{maxChange.toFixed(1)}%</span>
            <span>0%</span>
            <span>+{maxChange.toFixed(1)}%</span>
          </div>
        </div>

        {/* Analysis Dropdown */}
        <AnalysisDropdown
          isOpen={analysisDropdown.isOpen}
          onClose={() => setAnalysisDropdown({ isOpen: false, position: { top: 0, left: 0 } })}
          context="sector_rotation"
          data={sortedData}
          position={analysisDropdown.position}
        />
    </div>
  );
};

export default SectorBarChart;
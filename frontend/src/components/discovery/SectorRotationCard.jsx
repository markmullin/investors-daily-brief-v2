import React from 'react';
import { RotateCcw, ArrowUp, ArrowDown, Minus } from 'lucide-react';

/**
 * ↻ SECTOR ROTATION CARD - FIXED UI
 * 
 * Which industries are winning today
 * - Sector performance analysis
 * - Rotation signals and momentum
 * - Economic cycle positioning
 * 
 * FIXES:
 * ✅ Fixed height and width to fill container
 * ✅ Removed white space and layout issues
 * ✅ Consistent styling with other cards
 */
const SectorRotationCard = ({ data, isSelected, onClick }) => {
  const cardGradient = 'from-orange-500 to-amber-400';
  
  if (!data) {
    return (
      <div 
        className={`w-full h-full relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
          isSelected ? 'ring-2 ring-white ring-opacity-60 shadow-2xl' : 'shadow-lg hover:shadow-xl'
        }`}
        onClick={onClick}
      >
        <div className={`w-full h-full bg-gradient-to-br ${cardGradient} p-6 text-white relative flex flex-col`}>
          <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <RotateCcw className="w-6 h-6" />
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                Loading...
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">Sector Rotation</h3>
            <p className="text-sm opacity-90 mb-4">Which industries are winning today</p>
            
            {/* Loading placeholder content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mx-auto mb-2"></div>
                <div className="text-xs opacity-75">Analyzing sectors...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'strong_up':
        return <ArrowUp className="w-3 h-3 text-green-200" />;
      case 'up':
        return <ArrowUp className="w-3 h-3 text-yellow-200" />;
      case 'down':
        return <ArrowDown className="w-3 h-3 text-red-200" />;
      case 'strong_down':
        return <ArrowDown className="w-3 h-3 text-red-300" />;
      default:
        return <Minus className="w-3 h-3 text-gray-200" />;
    }
  };

  const getPerformanceColor = (performance) => {
    if (performance > 2) return 'text-green-200';
    if (performance > 0) return 'text-yellow-200';
    if (performance > -2) return 'text-orange-200';
    return 'text-red-200';
  };

  return (
    <div 
      className={`w-full h-full relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        isSelected ? 'ring-2 ring-white ring-opacity-60 shadow-2xl' : 'shadow-lg hover:shadow-xl'
      }`}
      onClick={onClick}
    >
      {/* Glass-morphism background - fills entire card */}
      <div className={`w-full h-full bg-gradient-to-br ${cardGradient} p-6 text-white relative flex flex-col`}>
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
        
        {/* Content - properly spaced within fixed height */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <RotateCcw className="w-6 h-6" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          
          <h3 className="text-lg font-bold mb-1">Sector Rotation</h3>
          <p className="text-sm opacity-90 mb-4">Which industries are winning today</p>
          
          {/* Content area - constrained to available space */}
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {/* Sector leaders preview */}
            {data.leaders && data.leaders.length > 0 && (
              <div className="space-y-2 flex-1 min-h-0">
                <div className="text-xs opacity-75">
                  ↻ {data.leaders.length} sectors analyzed
                </div>
                
                {/* Top 2 sectors preview */}
                <div className="space-y-1.5">
                  {data.leaders.slice(0, 2).map((leader, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(leader.trend)}
                          <span className="font-semibold truncate">{leader.sector}</span>
                        </div>
                        <div className={`font-bold ${getPerformanceColor(leader.performance)}`}>
                          {leader.performance > 0 ? '+' : ''}{leader.performance?.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-xs opacity-80 truncate">
                        {leader.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Market regime at bottom */}
            {data.marketRegime && (
              <div className="mt-auto pt-2">
                <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
                  <div className="truncate">{data.marketRegime}</div>
                </div>
              </div>
            )}
            
            {/* Rotation signal if no regime */}
            {!data.marketRegime && data.rotationSignal && (
              <div className="mt-auto pt-2">
                <div className="text-xs opacity-80">
                  🔄 {data.rotationSignal.substring(0, 50)}...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectorRotationCard;
/**
 * SIGNAL INDICATOR COMPONENT
 * 
 * Visual signal display (BUY/SELL/HOLD) with confidence level indicators
 * and click functionality for detailed explanations
 */

import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, 
  ChevronDown, ChevronUp, Info 
} from 'lucide-react';

const SignalIndicator = ({ 
  recommendation = 'HOLD', 
  confidence = 'medium',
  size = 'normal',
  showConfidenceBars = true,
  onClick = null,
  tooltip = null
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Get recommendation styling and icon
  const getRecommendationStyle = () => {
    switch (recommendation.toUpperCase()) {
      case 'BUY':
      case 'STRONG_BUY':
        return {
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          borderColor: 'border-green-500',
          hoverBg: 'hover:bg-green-600',
          icon: TrendingUp,
          label: recommendation.toUpperCase()
        };
      case 'SELL':
      case 'STRONG_SELL':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          borderColor: 'border-red-500',
          hoverBg: 'hover:bg-red-600',
          icon: TrendingDown,
          label: recommendation.toUpperCase()
        };
      case 'HOLD':
      default:
        return {
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
          borderColor: 'border-yellow-500',
          hoverBg: 'hover:bg-yellow-600',
          icon: Minus,
          label: 'HOLD'
        };
    }
  };

  // Get confidence bar configuration
  const getConfidenceConfig = () => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return { activeBars: 3, color: 'bg-green-400' };
      case 'medium':
        return { activeBars: 2, color: 'bg-yellow-400' };
      case 'low':
      default:
        return { activeBars: 1, color: 'bg-red-400' };
    }
  };

  // Get size configuration
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          containerClasses: 'px-2 py-1',
          textSize: 'text-xs',
          iconSize: 'w-3 h-3',
          barSize: 'w-1 h-2'
        };
      case 'large':
        return {
          containerClasses: 'px-4 py-2',
          textSize: 'text-base',
          iconSize: 'w-5 h-5',
          barSize: 'w-2 h-4'
        };
      case 'normal':
      default:
        return {
          containerClasses: 'px-3 py-1.5',
          textSize: 'text-sm',
          iconSize: 'w-4 h-4',
          barSize: 'w-1.5 h-3'
        };
    }
  };

  const recStyle = getRecommendationStyle();
  const confConfig = getConfidenceConfig();
  const sizeConfig = getSizeConfig();
  const Icon = recStyle.icon;

  const isClickable = onClick || tooltip;

  return (
    <div className="relative inline-flex items-center space-x-2">
      {/* Main Signal Button */}
      <button
        className={`
          ${recStyle.bgColor} ${recStyle.textColor} ${recStyle.borderColor}
          ${isClickable ? `${recStyle.hoverBg} cursor-pointer` : 'cursor-default'}
          ${sizeConfig.containerClasses} ${sizeConfig.textSize}
          rounded-lg border-2 font-semibold transition-all duration-200
          flex items-center space-x-1.5 relative
        `}
        onClick={onClick}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!isClickable}
      >
        <Icon className={sizeConfig.iconSize} />
        <span>{recStyle.label}</span>
        
        {/* Click indicator */}
        {isClickable && (
          <ChevronDown className="w-3 h-3 opacity-75" />
        )}
      </button>

      {/* Confidence Bars */}
      {showConfidenceBars && (
        <div className="flex items-end space-x-0.5">
          {[1, 2, 3].map(barIndex => (
            <div
              key={barIndex}
              className={`
                ${sizeConfig.barSize} rounded-sm transition-all duration-300
                ${barIndex <= confConfig.activeBars 
                  ? confConfig.color 
                  : 'bg-gray-300'
                }
              `}
              style={{
                transform: `scaleY(${barIndex <= confConfig.activeBars ? 1 : 0.4})`
              }}
            />
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap max-w-xs">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalIndicator;
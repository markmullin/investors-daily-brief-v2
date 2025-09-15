/**
 * ANALYSIS SECTION COMPONENT
 * 
 * Displays individual analysis sections (trend, momentum, signals, risk)
 * with appropriate styling and formatting for each type
 */

import React from 'react';
import { 
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, 
  Target, Shield, Activity, AlertTriangle 
} from 'lucide-react';

const AnalysisSection = ({ title, icon: Icon, data, type }) => {
  // Format value display based on type
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Handle price values
    if (key.includes('price') || key.includes('level')) {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : `$${numValue.toFixed(2)}`;
    }
    
    // Handle percentage values
    if (key.includes('rsi') || key.includes('confidence') || key.includes('percent')) {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : `${numValue.toFixed(1)}%`;
    }
    
    // Handle confidence levels
    if (key === 'confidence') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) return `${numValue.toFixed(0)}%`;
    }
    
    // Handle string values
    return String(value);
  };

  // Get color for trend indicators
  const getTrendColor = (trend) => {
    if (typeof trend === 'string') {
      const lowerTrend = trend.toLowerCase();
      if (lowerTrend.includes('bullish') || lowerTrend.includes('up') || lowerTrend.includes('positive')) {
        return 'text-green-600';
      }
      if (lowerTrend.includes('bearish') || lowerTrend.includes('down') || lowerTrend.includes('negative')) {
        return 'text-red-600';
      }
    }
    return 'text-gray-600';
  };

  // Get signal styling
  const getSignalStyle = (signal) => {
    if (typeof signal === 'string') {
      const lowerSignal = signal.toLowerCase();
      if (lowerSignal.includes('buy') || lowerSignal.includes('bullish')) {
        return 'bg-green-50 text-green-700 border-green-200';
      }
      if (lowerSignal.includes('sell') || lowerSignal.includes('bearish')) {
        return 'bg-red-50 text-red-700 border-red-200';
      }
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Render different section types
  const renderSectionContent = () => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      );
    }

    switch (type) {
      case 'trend':
        return (
          <div className="space-y-3">
            {data.overall_trend && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Direction:</span>
                <span className={`text-sm font-semibold ${getTrendColor(data.overall_trend)}`}>
                  {data.overall_trend}
                </span>
              </div>
            )}
            
            {data.trend_strength && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Strength:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data.trend_strength}
                </span>
              </div>
            )}
            
            {data.support_level && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Support:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatValue('support_level', data.support_level)}
                </span>
              </div>
            )}
            
            {data.resistance_level && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resistance:</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatValue('resistance_level', data.resistance_level)}
                </span>
              </div>
            )}
          </div>
        );

      case 'momentum':
        return (
          <div className="space-y-3">
            {data.current_rsi && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RSI:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatValue('current_rsi', data.current_rsi)}
                </span>
              </div>
            )}
            
            {data.rsi_signal && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RSI Signal:</span>
                <span className={`text-xs px-2 py-1 rounded border ${getSignalStyle(data.rsi_signal)}`}>
                  {data.rsi_signal}
                </span>
              </div>
            )}
            
            {data.ma_signal && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">MA Signal:</span>
                <span className={`text-xs px-2 py-1 rounded border ${getSignalStyle(data.ma_signal)}`}>
                  {data.ma_signal}
                </span>
              </div>
            )}
            
            {data.momentum_score && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Score:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatValue('momentum_score', data.momentum_score)}
                </span>
              </div>
            )}
          </div>
        );

      case 'signals':
        return (
          <div className="space-y-3">
            {data.recommendation && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Action:</span>
                <span className={`text-sm px-3 py-1 rounded-full border font-semibold ${getSignalStyle(data.recommendation)}`}>
                  {data.recommendation.toUpperCase()}
                </span>
              </div>
            )}
            
            {data.confidence && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confidence:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {formatValue('confidence', data.confidence)}
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          parseFloat(data.confidence) >= (i * 33) ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {data.entry_price && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Entry:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {formatValue('entry_price', data.entry_price)}
                </span>
              </div>
            )}
            
            {data.stop_loss && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stop Loss:</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatValue('stop_loss', data.stop_loss)}
                </span>
              </div>
            )}
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-3">
            {data.volatility && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Volatility:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data.volatility}
                </span>
              </div>
            )}
            
            {data.risk_level && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Risk Level:</span>
                <span className={`text-xs px-2 py-1 rounded border ${
                  data.risk_level.toLowerCase().includes('high') ? 'bg-red-50 text-red-700 border-red-200' :
                  data.risk_level.toLowerCase().includes('low') ? 'bg-green-50 text-green-700 border-green-200' :
                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {data.risk_level}
                </span>
              </div>
            )}
            
            {data.drawdown_risk && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Drawdown Risk:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatValue('drawdown_risk', data.drawdown_risk)}
                </span>
              </div>
            )}
          </div>
        );

      default:
        // Generic display for any data
        return (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Section Header */}
      <div className="flex items-center space-x-2 mb-3">
        <Icon className="w-4 h-4 text-blue-500" />
        <h6 className="text-sm font-semibold text-gray-800">{title}</h6>
      </div>

      {/* Section Content */}
      {renderSectionContent()}
    </div>
  );
};

export default AnalysisSection;
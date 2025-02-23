import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { useViewMode } from '../context/ViewModeContext';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const MonitoringDisplay = () => {
  const { status, data, alerts, error } = useMonitoring();
  const { viewMode } = useViewMode();

  if (status === 'initializing') {
    return (
      <div className="bg-white p-4 rounded-lg shadow animate-pulse">
        <p className="text-gray-500">Initializing market monitoring...</p>
      </div>
    );
  }

  if (status === 'error' || error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error || 'Error in market monitoring'}</span>
        </div>
      </div>
    );
  }

  // Safely handle missing data
  if (!data) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-500">No monitoring data available.</p>
      </div>
    );
  }

  // Safely extract properties with defaults to prevent errors
  const monitoring = data.monitoring || {};
  const score = data.score || { score: 0 };

  // Ensure score is treated as a number
  const scoreValue = typeof score === 'object' ? (score.score || 0) : (typeof score === 'number' ? score : 0);

  return (
    <div className="space-y-4">
      {/* Current Market State */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Market Monitor</h3>
        
        {/* Score Display */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-2xl font-bold">
            Score: {scoreValue.toFixed(1)}
          </div>
          {score.adjustments && (
            <div className={`flex items-center gap-1 ${
              score.adjustments.adjustment > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {score.adjustments.adjustment > 0 ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
              {Math.abs(score.adjustments.adjustment || 0).toFixed(1)} pts
            </div>
          )}
        </div>

        {/* Regime Display - with safe property access */}
        {monitoring.regimes && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Current Regime</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Market Phase</span>
                <div className="font-medium">
                  {monitoring.regimes.current?.riskRegime || 'Unknown'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Volatility</span>
                <div className="font-medium">
                  {monitoring.regimes.current?.volatilityRegime || 'Normal'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Display - with safe property access */}
        {monitoring.risks && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Risk Assessment</h4>
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Risk Level</span>
                <div className={`px-2 py-1 rounded text-sm ${
                  monitoring.risks.level === 'Low' ? 'bg-green-100 text-green-800' :
                  monitoring.risks.level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                  monitoring.risks.level === 'Elevated' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {monitoring.risks.level || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        {alerts && alerts.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recent Alerts</h4>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded ${
                    alert.severity === 'high' ? 'bg-red-50 text-red-700' :
                    alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-blue-50 text-blue-700'
                  }`}
                >
                  <div className="text-sm font-medium">{alert.message || 'Alert detected'}</div>
                  {viewMode === 'advanced' && alert.details && (
                    <div className="text-xs mt-1 opacity-75">
                      {typeof alert.details === 'object' 
                        ? JSON.stringify(alert.details) 
                        : String(alert.details)
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Details (Advanced Mode) - with safer property access */}
      {viewMode === 'advanced' && score.adjustments?.explanation && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Analysis Details</h3>
          <div className="text-sm text-gray-600">
            {score.adjustments.explanation}
          </div>
          {score.adjustments.components && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(score.adjustments.components).map(([component, value]) => (
                <div key={component} className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600 capitalize">{component}</div>
                  <div className={`font-medium ${
                    value > 0 ? 'text-green-600' : 
                    value < 0 ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {value > 0 ? '+' : ''}{Number(value).toFixed(1)} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringDisplay;
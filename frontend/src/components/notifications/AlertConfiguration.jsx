import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle,
  TrendingUp,
  Brain,
  Shield,
  DollarSign,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Info
} from 'lucide-react';

const AlertConfiguration = ({ portfolioId, onClose, onSave }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Default thresholds (fetched from API)
  const [defaultThresholds, setDefaultThresholds] = useState(null);

  useEffect(() => {
    loadDefaultThresholds();
    loadUserPreferences();
  }, [portfolioId]);

  const loadDefaultThresholds = async () => {
    try {
      const response = await fetch('/api/alerts/defaults');
      if (response.ok) {
        const data = await response.json();
        setDefaultThresholds(data.defaults);
      }
    } catch (error) {
      console.error('Error loading default thresholds:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      // For now, we'll use defaults since we don't have user preference storage yet
      // In a real implementation, this would load from user preferences API
      
      const defaultPrefs = {
        enabled: true,
        soundEnabled: true,
        portfolioGainLoss: {
          enabled: true,
          dailyGainPercent: 5.0,
          dailyLossPercent: -3.0,
          totalGainPercent: 20.0,
          totalLossPercent: -10.0
        },
        holdingAlerts: {
          enabled: true,
          priceChangePercent: 10.0,
          volumeSpikeMultiplier: 3.0
        },
        aiAlerts: {
          enabled: true,
          regimeChangeConfidence: 0.8,
          predictionConfidence: 0.85,
          sentimentShift: 0.3
        },
        riskAlerts: {
          enabled: true,
          portfolioRiskIncrease: 0.15,
          concentrationThreshold: 0.4,
          correlationIncrease: 0.8
        }
      };

      setPreferences(defaultPrefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleTopLevelChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (defaultThresholds) {
      setPreferences({
        enabled: true,
        soundEnabled: true,
        ...defaultThresholds
      });
      setHasChanges(true);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/alerts/portfolio/${portfolioId}/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        console.log('✅ Preferences saved successfully');
        setHasChanges(false);
        onSave?.();
      } else {
        console.error('Failed to save preferences');
        alert('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Loading preferences...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Alert Configuration</h2>
                <p className="text-sm text-gray-600">Configure your notification preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Global Settings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Global Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {preferences.enabled ? <Bell className="w-5 h-5 text-green-500" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                  <div>
                    <label className="font-medium text-gray-900">Enable Notifications</label>
                    <p className="text-sm text-gray-600">Turn all notifications on or off</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enabled}
                  onChange={(e) => handleTopLevelChange('enabled', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {preferences.soundEnabled ? <Volume2 className="w-5 h-5 text-blue-500" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                  <div>
                    <label className="font-medium text-gray-900">Sound Notifications</label>
                    <p className="text-sm text-gray-600">Play sounds for alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => handleTopLevelChange('soundEnabled', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Portfolio Performance Alerts */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Portfolio Performance Alerts
              </h3>
              <input
                type="checkbox"
                checked={preferences.portfolioGainLoss.enabled}
                onChange={(e) => handlePreferenceChange('portfolioGainLoss', 'enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Gain Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.portfolioGainLoss.dailyGainPercent}
                  onChange={(e) => handlePreferenceChange('portfolioGainLoss', 'dailyGainPercent', parseFloat(e.target.value))}
                  disabled={!preferences.portfolioGainLoss.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when daily gain exceeds this percentage</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Loss Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.portfolioGainLoss.dailyLossPercent}
                  onChange={(e) => handlePreferenceChange('portfolioGainLoss', 'dailyLossPercent', parseFloat(e.target.value))}
                  disabled={!preferences.portfolioGainLoss.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when daily loss exceeds this percentage (negative value)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Gain Milestone (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.portfolioGainLoss.totalGainPercent}
                  onChange={(e) => handlePreferenceChange('portfolioGainLoss', 'totalGainPercent', parseFloat(e.target.value))}
                  disabled={!preferences.portfolioGainLoss.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Celebrate when total gains reach this milestone</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Loss Alert (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.portfolioGainLoss.totalLossPercent}
                  onChange={(e) => handlePreferenceChange('portfolioGainLoss', 'totalLossPercent', parseFloat(e.target.value))}
                  disabled={!preferences.portfolioGainLoss.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when total losses reach this threshold (negative value)</p>
              </div>
            </div>
          </div>

          {/* Individual Holding Alerts */}
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Individual Holding Alerts
              </h3>
              <input
                type="checkbox"
                checked={preferences.holdingAlerts.enabled}
                onChange={(e) => handlePreferenceChange('holdingAlerts', 'enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Change Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.holdingAlerts.priceChangePercent}
                  onChange={(e) => handlePreferenceChange('holdingAlerts', 'priceChangePercent', parseFloat(e.target.value))}
                  disabled={!preferences.holdingAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when individual holdings move by this percentage</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume Spike Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.holdingAlerts.volumeSpikeMultiplier}
                  onChange={(e) => handlePreferenceChange('holdingAlerts', 'volumeSpikeMultiplier', parseFloat(e.target.value))}
                  disabled={!preferences.holdingAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when volume is this many times the average</p>
              </div>
            </div>
          </div>

          {/* AI-Powered Alerts */}
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                AI-Powered Alerts
              </h3>
              <input
                type="checkbox"
                checked={preferences.aiAlerts.enabled}
                onChange={(e) => handlePreferenceChange('aiAlerts', 'enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regime Change Confidence
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={preferences.aiAlerts.regimeChangeConfidence}
                  onChange={(e) => handlePreferenceChange('aiAlerts', 'regimeChangeConfidence', parseFloat(e.target.value))}
                  disabled={!preferences.aiAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Minimum confidence for market regime change alerts (0-1)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prediction Confidence
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={preferences.aiAlerts.predictionConfidence}
                  onChange={(e) => handlePreferenceChange('aiAlerts', 'predictionConfidence', parseFloat(e.target.value))}
                  disabled={!preferences.aiAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Minimum confidence for ML prediction alerts (0-1)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentiment Shift Threshold
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={preferences.aiAlerts.sentimentShift}
                  onChange={(e) => handlePreferenceChange('aiAlerts', 'sentimentShift', parseFloat(e.target.value))}
                  disabled={!preferences.aiAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when sentiment shifts by this amount (0-1)</p>
              </div>
            </div>
          </div>

          {/* Risk Management Alerts */}
          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Risk Management Alerts
              </h3>
              <input
                type="checkbox"
                checked={preferences.riskAlerts.enabled}
                onChange={(e) => handlePreferenceChange('riskAlerts', 'enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Risk Increase
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={preferences.riskAlerts.portfolioRiskIncrease}
                  onChange={(e) => handlePreferenceChange('riskAlerts', 'portfolioRiskIncrease', parseFloat(e.target.value))}
                  disabled={!preferences.riskAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when portfolio risk increases by this amount</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concentration Threshold
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={preferences.riskAlerts.concentrationThreshold}
                  onChange={(e) => handlePreferenceChange('riskAlerts', 'concentrationThreshold', parseFloat(e.target.value))}
                  disabled={!preferences.riskAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when single holding exceeds this percentage (0-1)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correlation Alert Level
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={preferences.riskAlerts.correlationIncrease}
                  onChange={(e) => handlePreferenceChange('riskAlerts', 'correlationIncrease', parseFloat(e.target.value))}
                  disabled={!preferences.riskAlerts.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-600 mt-1">Alert when holdings become too correlated (0-1)</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How Alerts Work</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Alerts are checked every 60 seconds to respect API rate limits</li>
                  <li>• AI alerts use machine learning predictions with confidence scores</li>
                  <li>• Risk alerts help you maintain proper portfolio diversification</li>
                  <li>• All thresholds are customizable to match your investment style</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              disabled={!hasChanges || saving}
              className={`
                px-6 py-2 rounded-lg transition-colors flex items-center space-x-2
                ${hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertConfiguration;
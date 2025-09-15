import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  Clock
} from 'lucide-react';

const NotificationToast = ({ 
  alert, 
  onClose, 
  onAcknowledge, 
  autoDismiss = true, 
  dismissAfter = 5000,
  playSound = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in animation
    setIsVisible(true);

    // Play sound if enabled
    if (playSound) {
      playNotificationSound(alert.severity);
    }

    // Auto-dismiss functionality
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleClose();
      }, dismissAfter);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissAfter, playSound, alert.severity]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(alert);
    }, 300); // Wait for exit animation
  };

  const handleAcknowledge = () => {
    onAcknowledge?.(alert);
    handleClose();
  };

  const playNotificationSound = (severity) => {
    try {
      // Create audio context for different alert sounds
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different tones for different severities
      const frequencies = {
        high: [800, 600, 400], // Urgent descending tone
        medium: [600, 800],     // Two-tone chime
        low: [400]              // Single gentle tone
      };

      const freq = frequencies[severity] || frequencies.medium;
      
      freq.forEach((frequency, index) => {
        setTimeout(() => {
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        }, index * 150);
      });

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const getAlertIcon = (type) => {
    const iconMap = {
      // Portfolio alerts
      portfolio_daily_gain: TrendingUp,
      portfolio_daily_loss: TrendingDown,
      portfolio_milestone_gain: CheckCircle,
      portfolio_value_change: DollarSign,
      
      // Holding alerts
      holding_price_change: BarChart3,
      holding_portfolio_impact: TrendingUp,
      
      // Risk alerts
      concentration_risk: Shield,
      
      // AI alerts
      ai_regime_change: Brain,
      ai_prediction_alert: Brain,
      ai_sentiment_shift: Brain,
      ai_rebalancing_alert: Brain,
      
      // General
      test: Info,
      default: AlertTriangle
    };

    const IconComponent = iconMap[type] || iconMap.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const getSeverityStyles = (severity) => {
    const styles = {
      high: {
        border: 'border-l-red-500',
        bg: 'bg-red-50',
        icon: 'text-red-500',
        title: 'text-red-800',
        message: 'text-red-700',
        badge: 'bg-red-500 text-white'
      },
      medium: {
        border: 'border-l-yellow-500',
        bg: 'bg-yellow-50',
        icon: 'text-yellow-500',
        title: 'text-yellow-800',
        message: 'text-yellow-700',
        badge: 'bg-yellow-500 text-white'
      },
      low: {
        border: 'border-l-green-500',
        bg: 'bg-green-50',
        icon: 'text-green-500',
        title: 'text-green-800',
        message: 'text-green-700',
        badge: 'bg-green-500 text-white'
      }
    };

    return styles[severity] || styles.medium;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString();
  };

  const styles = getSeverityStyles(alert.severity);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 w-96 max-w-sm
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          ${styles.bg} ${styles.border} border-l-4 rounded-lg shadow-lg 
          border border-gray-200 overflow-hidden
          hover:shadow-xl transition-shadow duration-200
        `}
      >
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${styles.icon} flex-shrink-0`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className={`${styles.title} font-semibold text-sm`}>
                    {alert.title}
                  </h4>
                  <span className={`${styles.badge} px-2 py-1 rounded-full text-xs font-medium uppercase`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                  {alert.symbol && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-mono text-gray-600">
                        {alert.symbol}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="px-4 pb-3">
          <p className={`${styles.message} text-sm leading-relaxed`}>
            {alert.message}
          </p>
        </div>

        {/* Data Details (if available) */}
        {alert.data && (
          <div className="px-4 pb-3">
            <div className="bg-white bg-opacity-50 rounded p-2 text-xs">
              {alert.data.changePercent && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Change:</span>
                  <span className={`font-medium ${alert.data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {alert.data.changePercent >= 0 ? '+' : ''}{alert.data.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
              {alert.data.currentValue && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium text-gray-800">
                    ${alert.data.currentValue.toLocaleString()}
                  </span>
                </div>
              )}
              {alert.data.confidence && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium text-gray-800">
                    {(alert.data.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white bg-opacity-30 px-4 py-3 flex justify-end space-x-2">
          {alert.type.startsWith('ai_') && (
            <button
              onClick={handleAcknowledge}
              className={`
                px-3 py-1 text-xs font-medium rounded 
                ${styles.badge} hover:opacity-90 transition-opacity
              `}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              Acknowledge
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {autoDismiss && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
            <div
              className={`h-full ${styles.border.replace('border-l-', 'bg-')} transition-all ease-linear`}
              style={{
                animation: `shrink ${dismissAfter}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
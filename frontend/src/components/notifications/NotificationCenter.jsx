import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  Settings, 
  History, 
  X, 
  CheckCircle, 
  Trash2,
  Filter,
  VolumeX,
  Volume2
} from 'lucide-react';
import NotificationToast from './NotificationToast';
import AlertHistory from './AlertHistory';
import AlertConfiguration from './AlertConfiguration';
import webSocketClient from './WebSocketClient';

const NotificationCenter = ({ portfolioId = 'portfolio_1' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState('all'); // all, high, medium, low
  const [toastNotifications, setToastNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const maxNotifications = 50;
  const maxToasts = 3;

  // Initialize WebSocket connection and listeners
  useEffect(() => {
    console.log('🔔 Initializing Notification Center...');

    // Subscribe to connection status
    const unsubscribeConnection = webSocketClient.onConnection((status, error) => {
      console.log('📡 Connection status:', status);
      setConnectionStatus(status);
    });

    // Subscribe to portfolio alerts
    const unsubscribeAlerts = webSocketClient.onPortfolioAlerts((data) => {
      console.log('🚨 Portfolio alerts received:', data);
      handleNewAlerts(data.alerts);
    });

    // Initialize alert service on component mount
    initializeAlertService();

    // Cleanup
    return () => {
      unsubscribeConnection();
      unsubscribeAlerts();
    };
  }, [portfolioId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load existing notifications on mount
  useEffect(() => {
    loadNotificationHistory();
  }, [portfolioId]);

  /**
   * Initialize the alert service
   */
  const initializeAlertService = async () => {
    try {
      const response = await fetch('/api/alerts/portfolio/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        console.log('✅ Alert service initialized');
      } else {
        console.warn('⚠️ Failed to initialize alert service');
      }
    } catch (error) {
      console.error('❌ Error initializing alert service:', error);
    }
  };

  /**
   * Load notification history from server
   */
  const loadNotificationHistory = async () => {
    try {
      const response = await fetch(`/api/alerts/portfolio/${portfolioId}`);
      if (response.ok) {
        const data = await response.json();
        const processedNotifications = data.alerts.map(alert => ({
          ...alert,
          read: false,
          acknowledged: false
        }));
        
        setNotifications(processedNotifications);
        setUnreadCount(processedNotifications.length);
        console.log(`📋 Loaded ${processedNotifications.length} notifications`);
      }
    } catch (error) {
      console.error('❌ Error loading notification history:', error);
    }
  };

  /**
   * Handle new alerts from WebSocket
   */
  const handleNewAlerts = (newAlerts) => {
    const processedAlerts = newAlerts.map(alert => ({
      ...alert,
      id: alert.id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      acknowledged: false,
      receivedAt: Date.now()
    }));

    // Add to notifications list
    setNotifications(prev => {
      const updated = [...processedAlerts, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Update unread count
    setUnreadCount(prev => prev + processedAlerts.length);

    // Show toast notifications (limit to maxToasts)
    const newToasts = processedAlerts.slice(0, maxToasts);
    setToastNotifications(prev => {
      const updated = [...prev, ...newToasts];
      return updated.slice(-maxToasts); // Keep only latest
    });

    console.log(`🔔 Added ${processedAlerts.length} new notifications`);
  };

  /**
   * Mark notification as read
   */
  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  /**
   * Acknowledge notification
   */
  const acknowledgeNotification = async (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, acknowledged: true, read: true } : notif
    ));
    
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Call API to acknowledge
    try {
      await fetch(`/api/alerts/alert/${notificationId}/acknowledge`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('❌ Error acknowledging notification:', error);
    }
  };

  /**
   * Remove toast notification
   */
  const removeToast = (alert) => {
    setToastNotifications(prev => prev.filter(t => t.id !== alert.id));
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  /**
   * Clear all notifications
   */
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setToastNotifications([]);
  };

  /**
   * Filter notifications based on selected filter
   */
  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    return notifications.filter(notif => notif.severity === filter);
  };

  /**
   * Get connection status indicator
   */
  const getConnectionIndicator = () => {
    const indicators = {
      connected: { color: 'text-green-500', text: 'Connected' },
      connecting: { color: 'text-yellow-500', text: 'Connecting...' },
      disconnected: { color: 'text-red-500', text: 'Disconnected' },
      error: { color: 'text-red-500', text: 'Connection Error' },
      failed: { color: 'text-red-500', text: 'Connection Failed' }
    };

    return indicators[connectionStatus] || indicators.disconnected;
  };

  const connectionIndicator = getConnectionIndicator();

  return (
    <>
      {/* Main Notification Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            relative p-2 rounded-lg transition-colors duration-200
            ${connectionStatus === 'connected' ? 'hover:bg-gray-100' : 'hover:bg-red-50'}
            ${isDropdownOpen ? 'bg-gray-100' : ''}
          `}
          title="Notifications"
        >
          {unreadCount > 0 ? (
            <BellRing className={`w-6 h-6 ${connectionStatus === 'connected' ? 'text-blue-600' : 'text-gray-400'}`} />
          ) : (
            <Bell className={`w-6 h-6 ${connectionStatus === 'connected' ? 'text-gray-600' : 'text-gray-400'}`} />
          )}
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Connection Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${connectionIndicator.color.replace('text-', 'bg-')} border-2 border-white`} />
        </button>

        {/* Notification Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Alert settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View history"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${connectionIndicator.color.replace('text-', 'bg-')}`} />
                  <span className="text-sm text-gray-600">{connectionIndicator.text}</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center space-x-2 mt-3">
                <Filter className="w-4 h-4 text-gray-400" />
                {['all', 'high', 'medium', 'low'].map(severity => (
                  <button
                    key={severity}
                    onClick={() => setFilter(severity)}
                    className={`
                      px-2 py-1 text-xs rounded font-medium transition-colors
                      ${filter === severity 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {getFilteredNotifications().length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                  <p className="text-sm mt-1">
                    {filter !== 'all' ? `No ${filter} priority alerts` : 'You\'re all caught up!'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {getFilteredNotifications().map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onAcknowledge={acknowledgeNotification}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear all</span>
                </button>
                <span className="text-xs text-gray-500">
                  {notifications.length} total
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toastNotifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ transform: `translateY(${index * 10}px)` }}
          >
            <NotificationToast
              alert={notification}
              onClose={removeToast}
              onAcknowledge={acknowledgeNotification}
              playSound={soundEnabled}
              autoDismiss={true}
              dismissAfter={5000}
            />
          </div>
        ))}
      </div>

      {/* Alert History Modal */}
      {isHistoryOpen && (
        <AlertHistory
          portfolioId={portfolioId}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Alert Configuration Modal */}
      {isConfigOpen && (
        <AlertConfiguration
          portfolioId={portfolioId}
          onClose={() => setIsConfigOpen(false)}
          onSave={() => {
            setIsConfigOpen(false);
            // Optionally reload notifications
          }}
        />
      )}
    </>
  );
};

// Individual notification item component
const NotificationItem = ({ notification, onMarkRead, onAcknowledge }) => {
  const getSeverityColor = (severity) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[severity] || colors.medium;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`
        p-3 hover:bg-gray-50 transition-colors cursor-pointer
        ${notification.read ? 'opacity-75' : ''}
      `}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        {/* Unread indicator */}
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </p>
            <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(notification.severity)}`}>
              {notification.severity}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatTimestamp(notification.timestamp)}
            </span>
            
            {notification.type.startsWith('ai_') && !notification.acknowledged && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge(notification.id);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
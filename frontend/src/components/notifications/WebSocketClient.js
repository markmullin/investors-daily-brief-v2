/**
 * WebSocket Client for Portfolio Notifications
 * Handles real-time communication with backend alert system
 * Phase 6B: Frontend Notification System
 */

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.url = 'ws://localhost:5000/ws/market';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.isConnected = false;
    this.messageQueue = [];
    this.listeners = new Map();
    this.connectionListeners = new Set();
    
    // Auto-reconnect settings
    this.shouldReconnect = true;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    
    console.log('📡 WebSocket client initialized');
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.isConnecting || this.isConnected) {
      console.log('⚠️ WebSocket already connecting or connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        console.log(`📡 Connecting to WebSocket: ${this.url}`);

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Process queued messages
          this.processMessageQueue();
          
          // Notify connection listeners
          this.notifyConnectionListeners('connected');
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('📡 WebSocket connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.isConnecting = false;
          
          // Stop heartbeat
          this.stopHeartbeat();
          
          // Notify connection listeners
          this.notifyConnectionListeners('disconnected');
          
          // Auto-reconnect if needed
          if (this.shouldReconnect && !event.wasClean) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          
          // Notify connection listeners
          this.notifyConnectionListeners('error', error);
          
          reject(error);
        };

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    console.log('📡 Disconnecting WebSocket...');
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'User requested disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyConnectionListeners('disconnected');
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.notifyConnectionListeners('failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(() => {
          // Reconnection failed, will try again
        });
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('⚠️ Heartbeat timeout, connection may be dead');
          this.ws?.close();
        }, 5000);
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    // Handle heartbeat response
    if (data.type === 'pong') {
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
      }
      return;
    }

    console.log('📨 WebSocket message received:', data.type);
    
    // Notify specific listeners
    const listeners = this.listeners.get(data.type) || new Set();
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Error in ${data.type} listener:`, error);
      }
    });

    // Notify general message listeners
    const generalListeners = this.listeners.get('*') || new Set();
    generalListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error in general message listener:', error);
      }
    });
  }

  /**
   * Send message to WebSocket server
   */
  send(message) {
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 Message sent:', message.type);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        this.queueMessage(message);
      }
    } else {
      console.log('📝 Queueing message (not connected):', message.type);
      this.queueMessage(message);
    }
  }

  /**
   * Queue message for when connection is restored
   */
  queueMessage(message) {
    this.messageQueue.push({
      ...message,
      queuedAt: Date.now()
    });
    
    // Keep only last 100 messages
    if (this.messageQueue.length > 100) {
      this.messageQueue = this.messageQueue.slice(-100);
    }
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    console.log(`📝 Processing ${this.messageQueue.length} queued messages...`);
    
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      // Only send messages queued in the last 5 minutes
      if (Date.now() - message.queuedAt < 5 * 60 * 1000) {
        this.send(message);
      }
    }
  }

  /**
   * Subscribe to specific message types
   */
  on(messageType, callback) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }
    
    this.listeners.get(messageType).add(callback);
    
    console.log(`📡 Subscribed to ${messageType} messages`);
    
    // Return unsubscribe function
    return () => {
      this.off(messageType, callback);
    };
  }

  /**
   * Unsubscribe from message types
   */
  off(messageType, callback) {
    const listeners = this.listeners.get(messageType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(messageType);
      }
    }
    
    console.log(`📡 Unsubscribed from ${messageType} messages`);
  }

  /**
   * Subscribe to connection events
   */
  onConnection(callback) {
    this.connectionListeners.add(callback);
    
    // Immediately call with current status
    const status = this.isConnected ? 'connected' : 'disconnected';
    callback(status);
    
    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Notify connection listeners
   */
  notifyConnectionListeners(status, error = null) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(status, error);
      } catch (error) {
        console.error('❌ Error in connection listener:', error);
      }
    });
  }

  /**
   * Subscribe to portfolio alerts specifically
   */
  onPortfolioAlerts(callback) {
    return this.on('portfolio_alerts', callback);
  }

  /**
   * Subscribe to market updates
   */
  onMarketUpdate(callback) {
    return this.on('update', callback);
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      shouldReconnect: this.shouldReconnect
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    console.log('🛑 Destroying WebSocket client...');
    this.shouldReconnect = false;
    this.disconnect();
    this.listeners.clear();
    this.connectionListeners.clear();
    this.messageQueue = [];
  }
}

// Create and export singleton instance
const webSocketClient = new WebSocketClient();

// Auto-connect when module loads (in browser environment)
if (typeof window !== 'undefined') {
  // Connect after a short delay to allow React to initialize
  setTimeout(() => {
    webSocketClient.connect().catch(error => {
      console.warn('⚠️ Initial WebSocket connection failed:', error.message);
    });
  }, 1000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    webSocketClient.destroy();
  });
}

export default webSocketClient;
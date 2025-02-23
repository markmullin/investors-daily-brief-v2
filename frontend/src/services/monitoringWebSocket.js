import { featureFlags } from '../config/featureFlags';

class MonitoringWebSocket {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.enabled = featureFlags.useWebSocket;
  }

  connect() {
    // Don't connect if WebSocket is disabled
    if (!this.enabled) {
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(`ws://${window.location.hostname}:5000/ws/monitoring`);
      
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
        }
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.warn('WebSocket connection not available:', error.message);
    }
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.notifySubscribers(message.type, message.data);
    } catch (error) {
      console.warn('Error processing WebSocket message:', error);
    }
  }

  handleClose() {
    // Don't attempt reconnect if disabled
    if (this.enabled) {
      this.attemptReconnect();
    }
  }

  handleError(error) {
    console.warn('Monitoring WebSocket error:', error);
    // Don't attempt reconnect if disabled
    if (this.enabled) {
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, 5000);
  }

  subscribe(callback) {
    if (!this.enabled) {
      // Return dummy function if disabled
      console.info('WebSocket monitoring disabled, using fallback data');
      // Return a no-op unsubscribe function
      return () => {};
    }

    this.subscribers.add(callback);
    if (this.subscribers.size === 1) {
      this.connect();
    }
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  notifySubscribers(type, data) {
    this.subscribers.forEach(callback => {
      try {
        callback({ type, data });
      } catch (error) {
        console.warn('Error in subscriber callback:', error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = 0;
  }
}

export default new MonitoringWebSocket();
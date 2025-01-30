const WS_URL = 'ws://localhost:5000';

class WebSocketService {
  constructor() {
    this.subscribers = new Set();
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(WS_URL);
    
    this.ws.onopen = () => {
      console.log('WebSocket Connected');
      this.notify({ type: 'connection', status: 'connected' });
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.notify({ type: 'error', error });
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket Disconnected');
      this.notify({ type: 'connection', status: 'disconnected' });
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notify(data);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(data) {
    this.subscribers.forEach(callback => callback(data));
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }
}

export const wsService = new WebSocketService();
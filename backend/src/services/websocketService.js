import { WebSocketServer, WebSocket } from 'ws';
import { marketService } from './apiServices.js';

class WebSocketService {
  constructor() {
    this.clients = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.dataUpdateInterval = null;
  }

  initialize(server) {
    // Ensure single WebSocket instance
    if (this.wss) {
      console.log('WebSocket server already initialized');
      return;
    }
    const wss = new WebSocketServer({ 
      server,
      path: '/ws/market',
      clientTracking: true
    });
    
    this.wss = wss;

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    // 🔧 FIX: Don't start data updates immediately - wait for first client
    console.log('✅ WebSocket server initialized without automatic data fetching');
    // Removed: this.startDataUpdates();
}

  handleConnection(ws) {
    this.clients.add(ws);
    this.reconnectAttempts = 0;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.handleMessage(ws, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
        this.sendError(ws, error.message);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      
      // Stop data updates if no clients
      if (this.clients.size === 0 && this.dataUpdateInterval) {
        clearInterval(this.dataUpdateInterval);
        this.dataUpdateInterval = null;
        console.log('📡 Stopped data updates - no active clients');
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleReconnect(ws);
    });

    // 🔧 FIX: Start data updates only when first client connects
    if (this.clients.size === 1 && !this.dataUpdateInterval) {
      console.log('📡 Starting data updates - first client connected');
      this.startDataUpdates();
    }

    // 🔧 FIX: Send initial data with error handling that doesn't block
    setImmediate(() => this.sendInitialDataSafely(ws));
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        await this.handleSubscribe(ws, data.symbols);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, data.symbols);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  async handleSubscribe(ws, symbols) {
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }
    symbols.forEach(symbol => ws.subscriptions.add(symbol));
    
    // Send immediate data for subscribed symbols with error handling
    try {
      const quotes = await marketService.getDataForSymbols(symbols);
      this.sendToClient(ws, {
        type: 'quotes',
        data: quotes
      });
    } catch (error) {
      console.warn('Failed to fetch subscription data:', error.message);
      this.sendError(ws, 'Failed to fetch data for subscribed symbols');
    }
  }

  handleUnsubscribe(ws, symbols) {
    if (ws.subscriptions) {
      symbols.forEach(symbol => ws.subscriptions.delete(symbol));
    }
  }

  // 🔧 FIX: Safe initial data sending that doesn't block startup
  async sendInitialDataSafely(ws) {
    try {
      console.log('📡 Attempting to send initial data to WebSocket client...');
      
      const [marketData, sectorData] = await Promise.all([
        marketService.getData().catch(err => {
          console.warn('Failed to fetch market data:', err.message);
          return { error: 'Market data unavailable' };
        }),
        marketService.getSectorData().catch(err => {
          console.warn('Failed to fetch sector data:', err.message);
          return { error: 'Sector data unavailable' };
        })
      ]);

      this.sendToClient(ws, {
        type: 'initial',
        data: {
          market: marketData,
          sectors: sectorData
        }
      });
      
      console.log('✅ Initial data sent to WebSocket client');
    } catch (error) {
      console.warn('Error sending initial data (non-blocking):', error.message);
      this.sendToClient(ws, {
        type: 'initial',
        data: {
          market: { error: 'Market data unavailable' },
          sectors: { error: 'Sector data unavailable' }
        }
      });
    }
  }

  async sendInitialData(ws) {
    // Keep old method for compatibility, but make it safe
    return this.sendInitialDataSafely(ws);
  }

  startDataUpdates() {
    // Clear existing interval if any
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
    }

    console.log('📡 Starting WebSocket data updates (every 30 seconds)');

    // 🔧 FIX: Longer interval and better error handling
    this.dataUpdateInterval = setInterval(async () => {
      if (this.clients.size === 0) {
        // No clients, stop updates
        clearInterval(this.dataUpdateInterval);
        this.dataUpdateInterval = null;
        console.log('📡 Stopped data updates - no clients');
        return;
      }

      try {
        const marketData = await marketService.getData();
        this.broadcast({
          type: 'update',
          data: marketData
        });
      } catch (error) {
        console.warn('Data update error (non-blocking):', error.message);
        // Don't stop the interval, just skip this update
      }
    }, 30000); // 🔧 FIX: Increased to 30 seconds to reduce API load
  }

  handleReconnect(ws) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        if (ws.readyState === WebSocket.CLOSED) {
          this.handleConnection(ws);
        }
      }, delay);
    }
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to send WebSocket message:', error.message);
      }
    }
  }

  broadcast(data) {
    this.clients.forEach(client => {
      this.sendToClient(client, data);
    });
  }

  sendError(ws, message) {
    this.sendToClient(ws, {
      type: 'error',
      message
    });
  }

  // 🔧 NEW: Graceful shutdown
  shutdown() {
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('📡 WebSocket service shut down gracefully');
  }
}

export default new WebSocketService();

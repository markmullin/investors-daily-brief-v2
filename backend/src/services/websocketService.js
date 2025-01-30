import { WebSocketServer } from 'ws';
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
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    this.startDataUpdates();
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
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleReconnect(ws);
    });

    // Send initial data
    this.sendInitialData(ws);
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
    
    // Send immediate data for subscribed symbols
    const quotes = await marketService.getDataForSymbols(symbols);
    this.sendToClient(ws, {
      type: 'quotes',
      data: quotes
    });
  }

  handleUnsubscribe(ws, symbols) {
    if (ws.subscriptions) {
      symbols.forEach(symbol => ws.subscriptions.delete(symbol));
    }
  }

  async sendInitialData(ws) {
    try {
      const [marketData, sectorData] = await Promise.all([
        marketService.getData(),
        marketService.getSectorData()
      ]);

      this.sendToClient(ws, {
        type: 'initial',
        data: {
          market: marketData,
          sectors: sectorData
        }
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
      this.sendError(ws, 'Failed to load initial data');
    }
  }

  startDataUpdates() {
    // Clear existing interval if any
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
    }

    // Start new update interval
    this.dataUpdateInterval = setInterval(async () => {
      try {
        const marketData = await marketService.getData();
        this.broadcast({
          type: 'update',
          data: marketData
        });
      } catch (error) {
        console.error('Data update error:', error);
      }
    }, 5000); // Update every 5 seconds
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
      ws.send(JSON.stringify(data));
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
}

export default new WebSocketService();
// Update in backend/src/services/monitoringWebSocket.js
// Change the import line at the top:
import { WebSocketServer, WebSocket } from 'ws';  // Add WebSocket to the import

class MonitoringWebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  initialize(server) {
    if (this.wss) {
      console.log('Monitoring WebSocket already initialized');
      return;
    }

    try {
      // Create WebSocket server with the correct WebSocketServer class
      this.wss = new WebSocketServer({ 
        server,
        path: '/ws/monitoring',
        clientTracking: true
      });

      this.wss.on('connection', (ws) => {
        console.log('Client connected to monitoring WebSocket');
        this.clients.add(ws);

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            console.log('Received monitoring data:', data);
          } catch (error) {
            console.error('Monitoring WebSocket message error:', error);
          }
        });

        ws.on('close', () => {
          console.log('Client disconnected from monitoring WebSocket');
          this.clients.delete(ws);
        });

        ws.on('error', (error) => {
          console.error('Monitoring WebSocket error:', error);
          this.clients.delete(ws);
        });
      });

      console.log('Monitoring WebSocket initialized successfully');
    } catch (error) {
      console.error('Error initializing monitoring WebSocket:', error);
      throw error;
    }
  }

  broadcast(data) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          console.error('Error broadcasting to client:', error);
          this.clients.delete(client);
        }
      }
    });
  }
}

export default new MonitoringWebSocketService();
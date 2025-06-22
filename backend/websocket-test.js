/**
 * TEST WEBSOCKET INITIALIZATION - The likely culprit!
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

console.log('🔍 WEBSOCKET TEST: Testing WebSocket initialization...');

const app = express();

// Basic setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'websocket_test_ok' });
});

console.log('✅ WEBSOCKET TEST: Basic setup completed');

// Start server FIRST
const server = app.listen(5000, async () => {
  console.log('✅ WEBSOCKET TEST: Server started on port 5000');
  
  try {
    console.log('🔍 WEBSOCKET TEST: Now initializing WebSocket service...');
    
    // Import WebSocket service
    const websocketService = await import('./src/services/websocketService.js');
    console.log('✅ WEBSOCKET TEST: WebSocket service imported');
    
    // This is where it might hang!
    console.log('🔍 WEBSOCKET TEST: Calling websocketService.initialize(server)...');
    websocketService.default.initialize(server);
    console.log('✅ WEBSOCKET TEST: WebSocket service initialized successfully!');
    
    console.log('🎉 WEBSOCKET TEST: Complete success! WebSockets are NOT the problem.');
    
  } catch (error) {
    console.log('💥 WEBSOCKET TEST: WebSocket initialization failed!');
    console.log('🎯 FOUND THE HANG POINT:', error.message);
    console.log('📊 Stack trace:', error.stack);
  }
});

console.log('🔍 WEBSOCKET TEST: Server.listen() called, waiting for callback...');

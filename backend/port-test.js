/**
 * PORT TEST - Check if port 5000 is blocked
 */

import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.get('/health', (req, res) => {
  res.json({ status: 'port_test_ok', timestamp: new Date().toISOString() });
});

console.log('🔍 PORT TEST: Attempting to start server on port 5000...');

const server = app.listen(5000, () => {
  console.log('✅ PORT TEST: SUCCESS! Port 5000 is available and server started');
  console.log('🌍 Test URL: http://localhost:5000/health');
  
  // Auto-close after 3 seconds
  setTimeout(() => {
    server.close(() => {
      console.log('✅ PORT TEST: Server closed - port is free');
      process.exit(0);
    });
  }, 3000);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('❌ PORT TEST: Port 5000 is already in use!');
    console.log('💡 SOLUTION: Kill the existing process or use a different port');
    console.log('📋 To kill existing process:');
    console.log('   Windows: netstat -ano | findstr :5000');
    console.log('   Then: taskkill /PID <PID> /F');
  } else {
    console.log('❌ PORT TEST: Server error:', error.message);
  }
  process.exit(1);
});

console.log('⏳ PORT TEST: Waiting for server to start...');

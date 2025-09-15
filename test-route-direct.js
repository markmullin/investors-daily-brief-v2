/**
 * Direct test of the Market Environment V2 simple route
 */

import express from 'express';
import simpleRoute from './backend/src/routes/marketEnvironmentV2-simple.js';

const app = express();
app.use(express.json());

// Register the route
app.use('/api/market-env', simpleRoute);

// Test server
const PORT = 5001; // Different port to avoid conflict
const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`\nTest these endpoints:`);
  console.log(`  curl http://localhost:${PORT}/api/market-env`);
  console.log(`  curl http://localhost:${PORT}/api/market-env/test`);
  console.log(`\nPress Ctrl+C to stop`);
});

// Handle errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is in use. Trying another port...`);
    server.listen(5002);
  } else {
    console.error('Server error:', error);
  }
});

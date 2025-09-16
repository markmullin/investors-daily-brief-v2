import 'dotenv/config';

// Override Redis requirement for Render deployment
if (process.env.SKIP_REDIS_CHECK === 'true') {
  console.log('⚠️  REDIS CHECK BYPASSED - Running without Redis');
  process.env.REDIS_ENABLED = 'false';
}

// Import the main app
import('./index.js');
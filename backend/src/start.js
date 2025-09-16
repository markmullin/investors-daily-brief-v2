import 'dotenv/config';

// BYPASS REDIS CHECK FOR RENDER
process.env.REDIS_ENABLED = 'false';
process.env.SKIP_REDIS_CHECK = 'true';
console.log('⚠️ REDIS BYPASSED FOR DEPLOYMENT');

// Import the original index
import('./index.js');
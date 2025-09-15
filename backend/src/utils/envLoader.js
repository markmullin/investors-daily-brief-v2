/**
 * Environment Variable Loader
 * Ensures that environment variables are properly loaded throughout the application
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to root directory (2 levels up from utils)
const rootDir = path.resolve(__dirname, '../../');

// Load environment variables from .env file
const result = dotenv.config({ path: path.join(rootDir, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
  
  // Log API key availability (without revealing the keys)
  const apiKeys = {
    FMP: process.env.FMP_API_KEY ? 'Available' : 'Not set',
    EOD: process.env.EOD_API_KEY ? 'Available' : 'Not set',
    BRAVE: process.env.BRAVE_API_KEY ? 'Available' : 'Not set',
    MISTRAL: process.env.MISTRAL_API_KEY ? 'Available' : 'Not set',
    FRED: process.env.FRED_API_KEY ? 'Available' : 'Not set'
  };
  
  console.log('API Keys Status:');
  Object.entries(apiKeys).forEach(([key, status]) => {
    console.log(`- ${key}_API_KEY: ${status}`);
  });
}

export default {
  // Check if all required API keys are set
  checkApiKeys() {
    const requiredKeys = ['FMP_API_KEY', 'EOD_API_KEY', 'BRAVE_API_KEY', 'MISTRAL_API_KEY', 'FRED_API_KEY'];
    const missingKeys = requiredKeys.filter(key => !process.env[key]);
    
    if (missingKeys.length > 0) {
      console.warn(`Missing required API keys: ${missingKeys.join(', ')}`);
      return false;
    }
    
    return true;
  },
  
  // Get a specific environment variable
  get(key, defaultValue = '') {
    return process.env[key] || defaultValue;
  }
};

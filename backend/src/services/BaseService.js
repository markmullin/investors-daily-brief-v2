import axios from 'axios';

export class BaseService {
  constructor() {
    this.baseURL = 'https://eodhd.com/api';
    this.apiKey = process.env.EOD_API_KEY;
    
    // Create axios instance with default config
    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: {
        api_token: this.apiKey,
        fmt: 'json'
      }
    });
  }

  // Helper method for logging
  logDebug(message, data) {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
  }

  // Helper method for error logging
  logError(message, error) {
    console.error(`[${new Date().toISOString()}] ${message}:`, error);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}
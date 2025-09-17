// Global API configuration for production
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? '' 
  : 'https://investors-daily-brief.onrender.com';

// Override global fetch to automatically prepend API_BASE_URL
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // Only modify API calls
  if (typeof url === 'string' && url.startsWith('/api/')) {
    url = API_BASE_URL + url;
    console.log('API call redirected to:', url);
  }
  return originalFetch(url, options);
};

console.log('✅ API redirector installed. All /api/* calls will go to:', API_BASE_URL || 'localhost');

// Enhanced Service Worker with API Caching and Performance Optimizations
const CACHE_VERSION = 'market-dashboard-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Cache duration for different types of data
const CACHE_DURATIONS = {
  '/api/market/data': 60 * 1000, // 1 minute
  '/api/market/sectors': 3 * 60 * 1000, // 3 minutes
  '/api/market/history': 5 * 60 * 1000, // 5 minutes
  '/api/market/themes': 10 * 60 * 1000, // 10 minutes
  '/api/market/insights': 10 * 60 * 1000, // 10 minutes
  '/api/batch/history': 5 * 60 * 1000, // 5 minutes
  '/api/batch/quotes': 60 * 1000, // 1 minute
};

// URLs to cache on install
const STATIC_URLS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css'
];

// Helper to check if cache is still valid
function isCacheValid(response, url) {
  if (!response) return false;
  
  const cachedDate = response.headers.get('sw-cached-date');
  if (!cachedDate) return false;
  
  const cacheAge = Date.now() - new Date(cachedDate).getTime();
  const maxAge = Object.entries(CACHE_DURATIONS).find(([pattern]) => 
    url.includes(pattern)
  )?.[1] || 5 * 60 * 1000; // Default 5 minutes
  
  return cacheAge < maxAge;
}

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheName.startsWith(CACHE_VERSION)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API requests with stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first
  event.respondWith(handleStaticRequest(request));
});

// Stale-while-revalidate for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached response if valid
  if (cachedResponse && isCacheValid(cachedResponse, request.url)) {
    // Update cache in background
    fetchAndCache(request, cache);
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response and add timestamp header
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      console.log('Network failed, returning stale cache for:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-first for static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline fallback for documents
    if (request.destination === 'document') {
      return cache.match('/index.html');
    }
    throw error;
  }
}

// Background fetch and cache update
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
  } catch (error) {
    console.log('Background fetch failed:', error);
  }
}

// Message handler for cache management
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
  
  if (event.data.type === 'PREFETCH') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(API_CACHE).then(cache => {
        return Promise.all(
          urls.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                const headers = new Headers(response.headers);
                headers.set('sw-cached-date', new Date().toISOString());
                
                const modifiedResponse = new Response(response.body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: headers
                });
                
                return cache.put(url, modifiedResponse);
              }
            }).catch(() => {})
          )
        );
      })
    );
  }
});

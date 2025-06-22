// Clear cache script
import nodeCache from 'node-cache';

const cache = new nodeCache();
cache.flushAll();
console.log('Cache cleared successfully');

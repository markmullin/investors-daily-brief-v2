// simple-cache-clear.js - Clear cache without killing processes
import NodeCache from 'node-cache';

console.log('=== CLEARING NODE CACHE ===\n');

// Create cache instance and flush it
const cache = new NodeCache();
cache.flushAll();

console.log('✅ NodeCache cleared');
console.log('\nNote: This only clears in-memory cache.');
console.log('You may need to restart your backend to fully clear all caches.');

process.exit(0);
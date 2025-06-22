// Clear all cached market data
console.log('Clearing market dashboard cache...');

if (typeof window !== 'undefined' && window.localStorage) {
  const keysToRemove = [];
  
  // Find all cache keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('market_dashboard_cache_')) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all cache keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  });
  
  console.log(`\nCleared ${keysToRemove.length} cached items.`);
  console.log('Please refresh the page to load fresh data.');
} else {
  console.log('localStorage not available.');
}

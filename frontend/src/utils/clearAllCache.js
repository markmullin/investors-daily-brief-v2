// Comprehensive cache clearing utility
export const clearAllCache = () => {
  // Clear localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('market_dashboard_cache_') || key.includes('cache'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`Cleared ${keysToRemove.length} localStorage entries`);
  
  // Clear sessionStorage
  sessionStorage.clear();
  console.log('Cleared sessionStorage');
  
  // Clear any IndexedDB (if used)
  if (window.indexedDB) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
        console.log(`Deleted IndexedDB: ${db.name}`);
      });
    });
  }
  
  // Force clear browser cache by adding timestamp to requests
  window.FORCE_REFRESH = Date.now();
  
  return true;
};

// Add to window for easy console access
window.clearAllCache = clearAllCache;

// Auto-execute on load if URL contains ?clear-cache
if (window.location.search.includes('clear-cache')) {
  clearAllCache();
  console.log('Cache cleared due to URL parameter');
  // Remove the parameter from URL
  const url = new URL(window.location);
  url.searchParams.delete('clear-cache');
  window.history.replaceState({}, '', url);
}

export default clearAllCache;

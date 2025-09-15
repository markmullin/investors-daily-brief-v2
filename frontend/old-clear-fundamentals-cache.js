// *** EMERGENCY CACHE CLEARING SCRIPT ***
// Run this in your browser console to clear the fundamentals cache immediately

console.log('🧹 EMERGENCY: Clearing fundamentals cache...');

// Clear IndexedDB cache for fundamentals
(async function clearFundamentalsCache() {
  try {
    // Open the IndexedDB
    const request = indexedDB.open('MarketDashboardCache', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');
      
      // Delete specific fundamentals cache keys
      const cacheKeys = [
        'fundamentals_top_performers',
        'fundamentals_summary',
        'fundamentals_status'
      ];
      
      cacheKeys.forEach(key => {
        store.delete(key);
        console.log(`✅ Deleted cache: ${key}`);
      });
      
      transaction.oncomplete = function() {
        console.log('🎉 Fundamentals cache cleared successfully!');
        console.log('🔄 Refresh the page to see updated data');
      };
    };
    
    request.onerror = function() {
      console.error('❌ Failed to open IndexedDB');
    };
    
  } catch (error) {
    console.error('❌ Cache clearing failed:', error);
  }
})();

// Alternative: Clear all API cache
console.log('🧹 Also clearing all API cache as backup...');
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Browser storage cleared');
} catch (error) {
  console.error('❌ Storage clear failed:', error);
}

console.log(`
🎯 CACHE CLEARING COMPLETE

Instructions:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste this script and press Enter
4. Wait for "Cache cleared successfully!" message
5. Refresh the page

This will force the frontend to fetch fresh data from your backend.
`);

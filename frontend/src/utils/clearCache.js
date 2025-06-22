// Clear all dashboard cache entries
export const clearDashboardCache = () => {
  const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('market_dashboard_cache_'));
  cacheKeys.forEach(key => localStorage.removeItem(key));
  console.log(`Cleared ${cacheKeys.length} cache entries`);
};

// Add to window for easy access from console
window.clearDashboardCache = clearDashboardCache;

// Auto-clear cache on reload if shift is held (Shift+F5 or Shift+Cmd+R)
document.addEventListener('DOMContentLoaded', () => {
  if (window.event && window.event.shiftKey) {
    clearDashboardCache();
    console.log('Cache cleared due to shift-reload');
  }
});

// Export for use in other modules
export default clearDashboardCache;

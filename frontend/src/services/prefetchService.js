// Prefetching service for predictive data loading
class PrefetchService {
  constructor() {
    this.prefetchQueue = new Set();
    this.prefetchTimeout = null;
    this.observer = null;
    this.lastHoveredSector = null;
    this.lastHoveredStock = null;
  }

  // Initialize the service
  init() {
    // Set up intersection observer for viewport-based prefetching
    this.setupIntersectionObserver();
    
    // Set up hover listeners for predictive prefetching
    this.setupHoverListeners();
    
    // Prefetch common data on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.prefetchCommonData(), { timeout: 2000 });
    } else {
      setTimeout(() => this.prefetchCommonData(), 2000);
    }
  }

  // Setup intersection observer for components entering viewport
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const prefetchUrls = this.getUrlsForElement(element);
          
          if (prefetchUrls.length > 0) {
            this.addToPrefetchQueue(prefetchUrls);
          }
        }
      });
    }, options);

    // Start observing after DOM is ready
    setTimeout(() => {
      document.querySelectorAll('[data-prefetch]').forEach(el => {
        this.observer.observe(el);
      });
    }, 1000);
  }

  // Setup hover listeners for interactive elements
  setupHoverListeners() {
    // Sector hover prefetching
    document.addEventListener('mouseover', (e) => {
      const sectorElement = e.target.closest('[data-sector]');
      if (sectorElement && sectorElement.dataset.sector !== this.lastHoveredSector) {
        this.lastHoveredSector = sectorElement.dataset.sector;
        const period = sectorElement.dataset.period || '1d';
        
        // Prefetch sector details
        this.addToPrefetchQueue([
          `/api/market/sectors/${period}`,
          `/api/industry-analysis/sector/${this.lastHoveredSector}`
        ]);
      }

      // Stock hover prefetching
      const stockElement = e.target.closest('[data-symbol]');
      if (stockElement && stockElement.dataset.symbol !== this.lastHoveredStock) {
        this.lastHoveredStock = stockElement.dataset.symbol;
        
        // Prefetch stock data
        this.addToPrefetchQueue([
          `/api/market/quote/${this.lastHoveredStock}`,
          `/api/market/history/${this.lastHoveredStock}?period=1d`,
          `/api/market/history/${this.lastHoveredStock}?period=1m`
        ]);
      }
    });
  }

  // Get URLs to prefetch based on element type
  getUrlsForElement(element) {
    const urls = [];
    const prefetchType = element.dataset.prefetch;

    switch (prefetchType) {
      case 'sectors':
        urls.push('/api/market/sectors/1d', '/api/market/sectors/1w');
        break;
      case 'macro':
        urls.push('/api/macroeconomic/simple', '/api/market/macro');
        break;
      case 'relationships':
        urls.push('/api/relationships/correlations');
        break;
      case 'insights':
        urls.push('/api/market/insights', '/api/market/themes');
        break;
    }

    return urls;
  }

  // Add URLs to prefetch queue
  addToPrefetchQueue(urls) {
    urls.forEach(url => this.prefetchQueue.add(url));
    
    // Debounce prefetching
    if (this.prefetchTimeout) {
      clearTimeout(this.prefetchTimeout);
    }
    
    this.prefetchTimeout = setTimeout(() => {
      this.processPrefetchQueue();
    }, 100);
  }

  // Process the prefetch queue
  async processPrefetchQueue() {
    const urls = Array.from(this.prefetchQueue);
    this.prefetchQueue.clear();

    // Use service worker for prefetching if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PREFETCH',
        urls: urls.map(url => new URL(url, window.location.origin).href)
      });
    } else {
      // Fallback to fetch with low priority
      urls.forEach(url => {
        fetch(url, { 
          method: 'GET',
          priority: 'low',
          credentials: 'same-origin'
        }).catch(() => {}); // Ignore errors
      });
    }
  }

  // Prefetch common data on idle
  prefetchCommonData() {
    const commonUrls = [
      '/api/market/data',
      '/api/market/sp500-top',
      '/api/market/sectors/1d',
      '/api/market/macro',
      '/api/market/themes',
      '/api/market/insights'
    ];

    this.addToPrefetchQueue(commonUrls);
  }

  // Prefetch batch data for performance
  prefetchBatchData(symbols, type = 'history') {
    if (!symbols || symbols.length === 0) return;

    const batchUrl = type === 'history' 
      ? '/api/batch/history'
      : '/api/batch/quotes';

    // Create prefetch request
    fetch(batchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        symbols: symbols.slice(0, 20), // Limit to 20 symbols
        period: '1y'
      }),
      priority: 'low'
    }).catch(() => {}); // Ignore errors
  }

  // Clear prefetch cache
  clearCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      });
    }
  }

  // Destroy the service
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.prefetchTimeout) {
      clearTimeout(this.prefetchTimeout);
    }
    
    this.prefetchQueue.clear();
  }
}

// Export singleton instance
const prefetchService = new PrefetchService();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => prefetchService.init());
} else {
  prefetchService.init();
}

export default prefetchService;

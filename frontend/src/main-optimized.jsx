import React from "react";
import ReactDOM from "react-dom/client";
import AppWrapper from "./AppWrapper.jsx";
import "./index.css";
import clearAllCache from "./utils/clearAllCache.js";

// Make cache clearing available globally
window.clearAllCache = clearAllCache;

// Register enhanced service worker for better performance
if ('serviceWorker' in navigator) {
  // Register immediately, not just in production
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker-enhanced.js')
      .then(registration => {
        console.log('Enhanced Service Worker registered:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available, refresh to update');
            }
          });
        });
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
  
  // Handle controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Performance monitoring
if ('PerformanceObserver' in window) {
  // Monitor long tasks
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        }
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Some browsers don't support longtask
  }
  
  // Monitor navigation timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
        console.log(`Page load time: ${loadTime.toFixed(2)}ms`);
        
        // Send to monitoring if over 250ms
        if (loadTime > 250) {
          console.warn('Page load exceeded 250ms target:', {
            total: loadTime,
            dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
            tcp: navTiming.connectEnd - navTiming.connectStart,
            request: navTiming.responseStart - navTiming.requestStart,
            response: navTiming.responseEnd - navTiming.responseStart,
            dom: navTiming.domComplete - navTiming.domInteractive,
            load: navTiming.loadEventEnd - navTiming.loadEventStart
          });
        }
      }
    }, 0);
  });
}

// Enable concurrent features
ReactDOM.createRoot(document.getElementById("root"), {
  // Enable concurrent rendering for better performance
  unstable_enableSuspenseCallback: true
}).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

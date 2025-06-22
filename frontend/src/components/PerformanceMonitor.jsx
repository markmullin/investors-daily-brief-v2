import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Zap, AlertCircle } from 'lucide-react';

const PerformanceMonitor = ({ show = false }) => {
  const [metrics, setMetrics] = useState({
    apiLatency: [],
    renderTime: [],
    cacheHitRate: 0,
    activeRequests: 0,
    totalRequests: 0,
    avgLatency: 0
  });
  
  const [isVisible, setIsVisible] = useState(show);

  // Hook into fetch to monitor API calls
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = args[0];
      
      // Update active requests
      setMetrics(prev => ({
        ...prev,
        activeRequests: prev.activeRequests + 1,
        totalRequests: prev.totalRequests + 1
      }));
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        // Check if response was from cache
        const isFromCache = response.headers.get('x-from-cache') === 'true' ||
                           response.headers.get('cf-cache-status') === 'HIT' ||
                           latency < 10; // Very fast responses likely from cache
        
        // Update metrics
        setMetrics(prev => {
          const newApiLatency = [...prev.apiLatency.slice(-19), latency];
          const cacheHits = isFromCache ? prev.cacheHitRate + 1 : prev.cacheHitRate;
          
          return {
            ...prev,
            apiLatency: newApiLatency,
            activeRequests: Math.max(0, prev.activeRequests - 1),
            cacheHitRate: (cacheHits / prev.totalRequests) * 100,
            avgLatency: newApiLatency.reduce((a, b) => a + b, 0) / newApiLatency.length
          };
        });
        
        // Log slow requests
        if (latency > 250 && url.includes('/api/')) {
          console.warn(`Slow API call: ${url} took ${latency.toFixed(2)}ms`);
        }
        
        return response;
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          activeRequests: Math.max(0, prev.activeRequests - 1)
        }));
        throw error;
      }
    };
    
    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Monitor React render performance
  useEffect(() => {
    if (!window.PerformanceObserver) return;
    
    let renderObserver;
    
    try {
      renderObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('⚛️')) { // React marks
            setMetrics(prev => ({
              ...prev,
              renderTime: [...prev.renderTime.slice(-19), entry.duration]
            }));
          }
        }
      });
      
      renderObserver.observe({ entryTypes: ['measure'] });
    } catch (e) {
      // Some browsers don't support all entry types
    }
    
    return () => {
      if (renderObserver) {
        renderObserver.disconnect();
      }
    };
  }, []);

  // Calculate performance status
  const getPerformanceStatus = useCallback(() => {
    if (metrics.avgLatency === 0) return { status: 'loading', color: 'text-gray-500' };
    if (metrics.avgLatency < 100) return { status: 'excellent', color: 'text-green-500' };
    if (metrics.avgLatency < 250) return { status: 'good', color: 'text-blue-500' };
    if (metrics.avgLatency < 500) return { status: 'fair', color: 'text-yellow-500' };
    return { status: 'poor', color: 'text-red-500' };
  }, [metrics.avgLatency]);

  const perfStatus = getPerformanceStatus();

  // Mini view (always visible)
  const miniView = (
    <div 
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 cursor-pointer z-50 flex items-center gap-2"
      onClick={() => setIsVisible(!isVisible)}
    >
      <Activity className={`w-4 h-4 ${perfStatus.color}`} />
      <span className="text-sm font-medium">
        {metrics.avgLatency.toFixed(0)}ms
      </span>
      {metrics.activeRequests > 0 && (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </div>
  );

  // Full view
  const fullView = isVisible && (
    <div className="fixed bottom-16 right-4 bg-white rounded-lg shadow-xl p-4 z-50 w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Performance Monitor
        </h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        {/* Average Latency */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Avg API Latency:</span>
          <span className={`font-medium ${perfStatus.color}`}>
            {metrics.avgLatency.toFixed(0)}ms ({perfStatus.status})
          </span>
        </div>
        
        {/* Cache Hit Rate */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Cache Hit Rate:</span>
          <span className="font-medium">
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>
        
        {/* Active Requests */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Active Requests:</span>
          <span className="font-medium">
            {metrics.activeRequests} / {metrics.totalRequests}
          </span>
        </div>
        
        {/* Latency Chart */}
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-gray-500 mb-1">API Latency (last 20 calls)</div>
          <div className="flex items-end gap-1 h-12">
            {metrics.apiLatency.map((latency, i) => (
              <div
                key={i}
                className={`flex-1 ${
                  latency < 100 ? 'bg-green-400' :
                  latency < 250 ? 'bg-blue-400' :
                  latency < 500 ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}
                style={{ height: `${Math.min(100, (latency / 500) * 100)}%` }}
                title={`${latency.toFixed(0)}ms`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0ms</span>
            <span>250ms</span>
            <span>500ms</span>
          </div>
        </div>
        
        {/* Performance Tips */}
        {metrics.avgLatency > 250 && (
          <div className="mt-3 p-2 bg-yellow-50 rounded flex gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <div className="font-medium mb-1">Performance Tips:</div>
              <ul className="space-y-0.5">
                <li>• Check your network connection</li>
                <li>• Clear browser cache if needed</li>
                <li>• Reduce concurrent operations</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {miniView}
      {fullView}
    </>
  );
};

export default PerformanceMonitor;

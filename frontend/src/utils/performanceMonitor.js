/**
 * Performance monitoring utilities for tracking memory usage and render performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      memoryUsage: [],
      renderTimes: {},
      apiCallDurations: {},
      componentMountTimes: {}
    };
    
    this.maxMetricsHistory = 100;
    this.isMonitoring = false;
  }

  /**
   * Start monitoring performance metrics
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor memory usage if available
    if (performance.memory) {
      this.memoryInterval = setInterval(() => {
        this.recordMemoryUsage();
      }, interval);
    }
    
    console.log('🚀 Performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    console.log('🛑 Performance monitoring stopped');
  }

  /**
   * Record current memory usage
   */
  recordMemoryUsage() {
    if (!performance.memory) return;
    
    const memoryInfo = {
      timestamp: Date.now(),
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usedMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
      totalMB: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
      limitMB: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
    };
    
    this.metrics.memoryUsage.push(memoryInfo);
    
    // Keep only recent history
    if (this.metrics.memoryUsage.length > this.maxMetricsHistory) {
      this.metrics.memoryUsage.shift();
    }
    
    // Check for memory warnings
    const usagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    
    if (usagePercent > 90) {
      console.error(`⚠️ High memory usage: ${memoryInfo.usedMB}MB / ${memoryInfo.limitMB}MB (${usagePercent.toFixed(1)}%)`);
    } else if (usagePercent > 75) {
      console.warn(`⚠️ Memory usage: ${memoryInfo.usedMB}MB / ${memoryInfo.limitMB}MB (${usagePercent.toFixed(1)}%)`);
    }
    
    return memoryInfo;
  }

  /**
   * Measure component render time
   */
  measureComponentRender(componentName, callback) {
    const startTime = performance.now();
    
    const result = callback();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (!this.metrics.renderTimes[componentName]) {
      this.metrics.renderTimes[componentName] = [];
    }
    
    this.metrics.renderTimes[componentName].push({
      timestamp: Date.now(),
      duration
    });
    
    // Warn if render is slow
    if (duration > 16.67) { // More than one frame (60fps)
      console.warn(`⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * Measure API call duration
   */
  async measureApiCall(apiName, apiFunction) {
    const startTime = performance.now();
    
    try {
      const result = await apiFunction();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.apiCallDurations[apiName]) {
        this.metrics.apiCallDurations[apiName] = [];
      }
      
      this.metrics.apiCallDurations[apiName].push({
        timestamp: Date.now(),
        duration,
        success: true
      });
      
      // Warn if API call is slow
      if (duration > 1000) {
        console.warn(`⚠️ Slow API call: ${apiName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.apiCallDurations[apiName]) {
        this.metrics.apiCallDurations[apiName] = [];
      }
      
      this.metrics.apiCallDurations[apiName].push({
        timestamp: Date.now(),
        duration,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary() {
    const currentMemory = this.getCurrentMemoryUsage();
    const averageRenderTimes = this.getAverageRenderTimes();
    const apiPerformance = this.getApiPerformanceStats();
    
    return {
      memory: currentMemory,
      rendering: averageRenderTimes,
      api: apiPerformance,
      isHealthy: this.isPerformanceHealthy()
    };
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    if (!performance.memory) {
      return { available: false };
    }
    
    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    
    if (!latest) {
      return this.recordMemoryUsage();
    }
    
    return latest;
  }

  /**
   * Get average render times for each component
   */
  getAverageRenderTimes() {
    const averages = {};
    
    Object.entries(this.metrics.renderTimes).forEach(([component, times]) => {
      if (times.length === 0) return;
      
      const recentTimes = times.slice(-20); // Last 20 renders
      const sum = recentTimes.reduce((acc, t) => acc + t.duration, 0);
      const avg = sum / recentTimes.length;
      
      averages[component] = {
        average: avg.toFixed(2),
        count: times.length,
        slow: avg > 16.67 // More than one frame
      };
    });
    
    return averages;
  }

  /**
   * Get API performance statistics
   */
  getApiPerformanceStats() {
    const stats = {};
    
    Object.entries(this.metrics.apiCallDurations).forEach(([api, calls]) => {
      if (calls.length === 0) return;
      
      const recentCalls = calls.slice(-50);
      const successfulCalls = recentCalls.filter(c => c.success);
      const totalDuration = successfulCalls.reduce((acc, c) => acc + c.duration, 0);
      const avgDuration = successfulCalls.length > 0 ? totalDuration / successfulCalls.length : 0;
      
      stats[api] = {
        totalCalls: calls.length,
        successRate: ((successfulCalls.length / recentCalls.length) * 100).toFixed(1),
        averageDuration: avgDuration.toFixed(2),
        slow: avgDuration > 1000
      };
    });
    
    return stats;
  }

  /**
   * Check if performance is healthy
   */
  isPerformanceHealthy() {
    const memory = this.getCurrentMemoryUsage();
    
    if (memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 75) return false;
    }
    
    // Check for slow renders
    const renderTimes = this.getAverageRenderTimes();
    const hasSlowRenders = Object.values(renderTimes).some(t => t.slow);
    if (hasSlowRenders) return false;
    
    // Check for slow APIs
    const apiStats = this.getApiPerformanceStats();
    const hasSlowApis = Object.values(apiStats).some(s => s.slow);
    if (hasSlowApis) return false;
    
    return true;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const summary = this.getPerformanceSummary();
    
    console.group('📊 Performance Report');
    
    // Memory report
    if (summary.memory.available !== false) {
      console.group('💾 Memory Usage');
      console.log(`Used: ${summary.memory.usedMB}MB`);
      console.log(`Total: ${summary.memory.totalMB}MB`);
      console.log(`Limit: ${summary.memory.limitMB}MB`);
      console.log(`Usage: ${((summary.memory.usedJSHeapSize / summary.memory.jsHeapSizeLimit) * 100).toFixed(1)}%`);
      console.groupEnd();
    }
    
    // Render performance
    console.group('🎨 Render Performance');
    Object.entries(summary.rendering).forEach(([component, stats]) => {
      const icon = stats.slow ? '⚠️' : '✅';
      console.log(`${icon} ${component}: ${stats.average}ms (${stats.count} renders)`);
    });
    console.groupEnd();
    
    // API performance
    console.group('🌐 API Performance');
    Object.entries(summary.api).forEach(([api, stats]) => {
      const icon = stats.slow ? '⚠️' : '✅';
      console.log(`${icon} ${api}: ${stats.averageDuration}ms (${stats.successRate}% success)`);
    });
    console.groupEnd();
    
    // Overall health
    console.log(`\n🏥 Overall Health: ${summary.isHealthy ? '✅ Healthy' : '⚠️ Needs Attention'}`);
    
    console.groupEnd();
    
    return summary;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in components
export default performanceMonitor;

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const mountTime = performance.now();
    
    return () => {
      const unmountTime = performance.now();
      const lifespan = unmountTime - mountTime;
      
      if (!performanceMonitor.metrics.componentMountTimes[componentName]) {
        performanceMonitor.metrics.componentMountTimes[componentName] = [];
      }
      
      performanceMonitor.metrics.componentMountTimes[componentName].push({
        timestamp: Date.now(),
        lifespan
      });
    };
  }, [componentName]);
  
  return {
    measureRender: (callback) => performanceMonitor.measureComponentRender(componentName, callback),
    measureApi: (apiName, apiFunction) => performanceMonitor.measureApiCall(apiName, apiFunction)
  };
};
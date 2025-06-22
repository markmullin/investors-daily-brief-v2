import React from 'react';
import { AlertCircle, RefreshCw, Info } from 'lucide-react';
import { ErrorState, RefreshingIndicator } from './SkeletonLoaders';

// Enhanced error boundary for individual sections
class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Error in ${this.props.sectionName || 'section'}:`, error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Optional: Report error to logging service
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.props.sectionName);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  }

  render() {
    if (this.state.hasError) {
      const { sectionName = 'Section', fallback } = this.props;
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.handleRetry)
          : fallback;
      }
      
      // Default error UI
      return (
        <ErrorState
          title={`${sectionName} Error`}
          message={`${errorMessage}${this.state.retryCount > 1 ? ` (Attempt ${this.state.retryCount})` : ''}`}
          onRetry={this.handleRetry}
          showRetry={this.state.retryCount < 3} // Stop showing retry after 3 attempts
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with section error boundary
export function withSectionErrorBoundary(Component, sectionName, options = {}) {
  return React.forwardRef((props, ref) => (
    <SectionErrorBoundary 
      sectionName={sectionName}
      {...options}
    >
      <Component {...props} ref={ref} />
    </SectionErrorBoundary>
  ));
}

// Hook-based data section wrapper with integrated loading, error, and refresh states
export function DataSection({ 
  sectionName,
  loading = false,
  error = null,
  refreshing = false,
  onRetry = null,
  loadingSkeleton = null,
  errorFallback = null,
  showRefreshIndicator = true,
  className = "",
  children 
}) {
  // Loading state
  if (loading && loadingSkeleton) {
    return (
      <div className={`relative ${className}`}>
        {loadingSkeleton}
        {refreshing && showRefreshIndicator && (
          <RefreshingIndicator 
            isRefreshing={refreshing} 
            className="absolute top-2 right-2" 
          />
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        {errorFallback || (
          <ErrorState
            title={`${sectionName} Unavailable`}
            message={error}
            onRetry={onRetry}
            showRetry={!!onRetry}
          />
        )}
      </div>
    );
  }

  // Success state with optional refresh indicator
  return (
    <div className={`relative ${className}`}>
      <SectionErrorBoundary 
        sectionName={sectionName}
        onRetry={onRetry}
      >
        {children}
      </SectionErrorBoundary>
      {refreshing && showRefreshIndicator && (
        <RefreshingIndicator 
          isRefreshing={refreshing} 
          className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-sm" 
        />
      )}
    </div>
  );
}

// Status indicator component
export function SectionStatus({ 
  loading, 
  error, 
  refreshing, 
  lastUpdated, 
  onRefresh = null,
  className = "" 
}) {
  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-red-500 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span>Error</span>
      </div>
    );
  }

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
      {refreshing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </>
      ) : (
        <>
          <Info className="w-4 h-4" />
          <span>Updated {formatLastUpdated(lastUpdated)}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Global refresh button component
export function GlobalRefreshButton({ onRefresh, isRefreshing = false, className = "" }) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isRefreshing ? "Refreshing..." : "Refresh all data"}
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  );
}

export default SectionErrorBoundary;

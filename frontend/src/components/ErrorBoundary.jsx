import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Optional: send error to a logging service
  }

  resetErrorState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unknown error occurred';
      
      // Fallback UI that maintains dashboard layout
      return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Component Error</h3>
          </div>
          
          <p className="mb-3 text-gray-700">
            {errorMessage}
          </p>
          
          {this.state.errorInfo && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                Technical details
              </summary>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={this.resetErrorState}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Reload Page
            </button>
          </div>
          
          {this.props.fallback && (
            <div className="mt-4">
              {this.props.fallback}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
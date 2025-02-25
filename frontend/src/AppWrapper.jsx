import React, { Component } from 'react';
import App from './App';
import { AlertCircle, RefreshCw } from 'lucide-react';

class AppWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by AppWrapper:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center gap-3 text-red-600 mb-6">
              <AlertCircle className="w-8 h-8" />
              <h1 className="text-2xl font-semibold">Something went wrong</h1>
            </div>
            
            <p className="mb-4 text-gray-700">
              An error occurred in the dashboard. Please try refreshing the page.
            </p>
            
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium">{this.state.error?.toString()}</p>
              
              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                    Component stack trace
                  </summary>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48 text-gray-800">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.resetError}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <App />;
  }
}

export default AppWrapper;
import React, { Component } from 'react';
import App from './App';
import { ViewModeProvider } from './context/ViewModeContext';

class AppWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Error caught by AppWrapper:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Store error details for display
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="mb-4 text-gray-700">
              An error occurred in the dashboard. Please try refreshing the page.
            </p>
            <div className="p-4 bg-gray-50 rounded overflow-auto max-h-96 mb-4">
              <p className="text-red-500 font-mono">{this.state.error && this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    // If there's no error, render the App normally with ViewModeProvider
    return (
      <ViewModeProvider>
        <App />
      </ViewModeProvider>
    );
  }
}

export default AppWrapper;
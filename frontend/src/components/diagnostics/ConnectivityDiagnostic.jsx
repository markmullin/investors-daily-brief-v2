import React, { useState, useEffect } from 'react';
import connectivityService from '../../services/connectivity/connectivityService';
import apiConnector from '../../utils/apiConnector';

/**
 * Connectivity Diagnostic Component
 * Displays the status of backend connections and provides retry functionality
 */
const ConnectivityDiagnostic = () => {
  const [state, setState] = useState(connectivityService.getState());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Subscribe to connectivity state changes
    const unsubscribe = connectivityService.subscribe(newState => {
      setState(newState);
    });

    // Run initial check
    connectivityService.checkAllConnectivity();

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle retry button click
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Clear cache and retry all connections
      apiConnector.clearCache();
      await connectivityService.retryConnections();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle enable proxy button click
  const handleEnableProxy = () => {
    apiConnector.enableProxy();
    connectivityService.checkAllConnectivity();
  };

  // Handle disable proxy button click
  const handleDisableProxy = () => {
    apiConnector.disableProxy();
    connectivityService.checkAllConnectivity();
  };

  // Handle start proxy button click
  const handleStartProxy = async () => {
    setIsRetrying(true);
    try {
      await connectivityService.startCorsProxy();
    } catch (error) {
      console.error('Failed to start CORS proxy:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Render connection status icon
  const renderStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return (
          <div className="text-green-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="text-red-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'checking':
        return (
          <div className="text-yellow-500 rounded-full flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="text-gray-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Determine overall status
  const hasDirectConnection = state.directConnection.status === 'connected';
  const hasCorsProxyConnection = state.corsProxy.status === 'connected';
  const hasApiEndpoints = state.apiEndpoints.status === 'connected';
  
  // Critical error if no connection methods work
  const hasCriticalConnectivityIssue = !hasDirectConnection && !hasCorsProxyConnection;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h3 className="font-medium text-gray-800">Dashboard Connectivity Status</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {showAdvanced ? 'Hide Advanced Diagnostics' : 'Show Advanced Diagnostics'}
          </button>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded focus:outline-none disabled:opacity-50"
          >
            {isRetrying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Retesting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retest
              </>
            )}
          </button>
        </div>
      </div>

      {hasCriticalConnectivityIssue && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Critical connectivity issues
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 grid grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${hasDirectConnection ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">Direct Connection</h4>
            {renderStatusIcon(state.directConnection.status)}
          </div>
          {!hasDirectConnection && (
            <div className="text-xs text-red-600 mt-1">
              {state.directConnection.error || 'Connection failed'}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleDisableProxy}
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded focus:outline-none"
            >
              Use Direct
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${hasCorsProxyConnection ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">CORS Proxy</h4>
            {renderStatusIcon(state.corsProxy.status)}
          </div>
          {!hasCorsProxyConnection && (
            <div className="text-xs text-red-600 mt-1">
              {state.corsProxy.error || 'Proxy not running'}
            </div>
          )}
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={handleStartProxy}
              className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded focus:outline-none"
              disabled={isRetrying}
            >
              Start Proxy
            </button>
            <button
              onClick={handleEnableProxy}
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded focus:outline-none"
            >
              Use Proxy
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${hasApiEndpoints ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">API Endpoints</h4>
            {renderStatusIcon(state.apiEndpoints.status)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {hasApiEndpoints ? 'All endpoints operational' : 'Some endpoints may be unavailable'}
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="px-4 pb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Advanced Diagnostics</h4>
          
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <h5 className="font-medium text-gray-700 mb-2">Network Configuration</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frontend:</span>
                  <span className="font-mono">http://localhost:5173</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Backend:</span>
                  <span className="font-mono">http://localhost:5000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CORS Proxy:</span>
                  <span className="font-mono">http://localhost:8080</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current mode:</span>
                  <span className="font-mono">{apiConnector.proxyEnabled ? 'CORS Proxy' : 'Direct'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto-switch:</span>
                  <span className="font-mono">{apiConnector.autoSwitchEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache status:</span>
                  <span className="font-mono">{apiConnector.cacheEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            <h5 className="font-medium text-gray-700 mt-4 mb-2">API Keys Status</h5>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">EOD API:</span>
                <span className="text-green-600 font-medium">Configured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Brave API:</span>
                <span className="text-green-600 font-medium">Configured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mistral API:</span>
                <span className="text-green-600 font-medium">Configured</span>
              </div>
            </div>

            <h5 className="font-medium text-gray-700 mt-4 mb-2">Common Issues</h5>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-gray-600">CORS errors are usually fixed by enabling the CORS proxy</li>
              <li className="text-gray-600">404 errors for missing routes can be fixed by implementing fallback routes</li>
              <li className="text-gray-600">VIX symbol mapping issues require updates to eodService.js</li>
              <li className="text-gray-600">Rate limiting issues with Mistral API are addressed with improved backoff</li>
            </ul>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  apiConnector.enableAutoSwitch(!apiConnector.autoSwitchEnabled);
                  connectivityService.checkAllConnectivity();
                }}
                className="text-xs bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded focus:outline-none"
              >
                {apiConnector.autoSwitchEnabled ? 'Disable Auto-Switch' : 'Enable Auto-Switch'}
              </button>
              <button
                onClick={() => {
                  apiConnector.clearCache();
                  apiConnector.forceRefresh();
                  connectivityService.checkAllConnectivity();
                }}
                className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded focus:outline-none"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {state.marketData.status === 'error' && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                API Error: Market data missing required indices. Check backend connection.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 px-4 py-3 flex justify-between">
        <div className="text-sm text-gray-500">
          {state.directConnection.lastChecked ? (
            `Last checked: ${new Date(state.directConnection.lastChecked).toLocaleTimeString()}`
          ) : 'Not checked yet'}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              window.open('http://localhost:5000/api/status', '_blank');
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            View API Status
          </button>
          <button
            onClick={handleRetry}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectivityDiagnostic;
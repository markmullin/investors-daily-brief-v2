import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import apiConnector from '../utils/apiConnector';

/**
 * ConnectivityTest Component
 * Tests the connectivity to the backend API and displays the results
 */
const ConnectivityTest = ({ onFixApplied }) => {
  const [results, setResults] = useState({
    directConnection: { status: 'checking' },
    corsProxy: { status: 'checking' },
    apiEndpoints: { status: 'checking' }
  });
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testHistory, setTestHistory] = useState([]);

  // Run connectivity tests
  const runTests = async () => {
    setIsRunningTests(true);
    setResults({
      directConnection: { status: 'checking' },
      corsProxy: { status: 'checking' },
      apiEndpoints: { status: 'checking' }
    });

    try {
      // Test direct connection to backend
      const directResults = await testDirectConnection();
      
      // Test CORS proxy
      const proxyResults = await testCorsProxy();
      
      // Test API endpoints
      const endpointResults = await testApiEndpoints();
      
      // Update results
      const newResults = {
        directConnection: directResults,
        corsProxy: proxyResults,
        apiEndpoints: endpointResults
      };
      
      setResults(newResults);
      
      // Add to test history
      setTestHistory(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          results: { ...newResults }
        },
        ...prev.slice(0, 9) // Keep only the last 10 results
      ]);
      
      // Select the best connection mode based on results
      if (!directResults.status === 'connected' && proxyResults.status === 'connected') {
        // If direct fails but proxy works, use proxy
        apiConnector.enableProxy();
      } else if (directResults.status === 'connected' && !proxyResults.status === 'connected') {
        // If proxy fails but direct works, use direct
        apiConnector.disableProxy();
      }
      // If both work or both fail, keep current setting
    } catch (error) {
      console.error('Error running connectivity tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Test direct connection to backend
  const testDirectConnection = async () => {
    try {
      // Force direct connection for this test
      const wasProxyEnabled = apiConnector.proxyEnabled;
      apiConnector.disableProxy();
      
      // Try to fetch the health endpoint
      await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        mode: 'cors',
      });
      
      // Restore previous proxy setting
      if (wasProxyEnabled) {
        apiConnector.enableProxy();
      }
      
      return { status: 'connected', error: null };
    } catch (error) {
      console.log('Direct connection test failed:', error.message);
      
      // Check if it's a CORS error
      const isCorsError = error.message.includes('CORS') || 
                         error.message.includes('cross-origin') ||
                         error.message.includes('blocked by CORS policy');
      
      return { 
        status: 'error', 
        error: isCorsError ? 'CORS policy blocked the request' : error.message,
        isCorsError 
      };
    }
  };

  // Test CORS proxy
  const testCorsProxy = async () => {
    try {
      // Test if the CORS proxy is running by trying to access its health endpoint
      await fetch('http://localhost:8080/cors-proxy-health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        mode: 'cors',
      });
      
      return { status: 'connected', error: null };
    } catch (error) {
      console.log('CORS proxy test failed:', error.message);
      return { status: 'error', error: error.message };
    }
  };

  // Test API endpoints
  const testApiEndpoints = async () => {
    try {
      // Use the current connection mode (direct or proxy)
      const endpoints = [
        '/market/data',
        '/market/macro'
      ];
      
      const results = await Promise.all(
        endpoints.map(async endpoint => {
          try {
            await apiConnector.get(endpoint, { timeout: 5000, cache: false });
            return { endpoint, success: true };
          } catch (error) {
            return { endpoint, success: false, error: error.message };
          }
        })
      );
      
      const successCount = results.filter(r => r.success).length;
      const allSuccess = successCount === endpoints.length;
      const someSuccess = successCount > 0;
      
      if (allSuccess) {
        return { status: 'connected', endpoints: results };
      } else if (someSuccess) {
        return { status: 'partial', endpoints: results };
      } else {
        return { status: 'error', endpoints: results };
      }
    } catch (error) {
      console.log('API endpoints test failed:', error.message);
      return { status: 'error', error: error.message };
    }
  };

  // Run tests when component mounts
  useEffect(() => {
    runTests();
  }, []);

  // Handle retry button click
  const handleRetry = async () => {
    if (isRunningTests) return;
    
    // Clear API connector cache before retrying
    apiConnector.clearCache();
    
    // Run tests
    await runTests();
    
    // If callback provided, call it
    if (typeof onFixApplied === 'function') {
      onFixApplied();
    }
  };

  // Handle enable proxy button click
  const handleEnableProxy = () => {
    apiConnector.enableProxy();
    handleRetry();
  };

  // Handle disable proxy button click
  const handleDisableProxy = () => {
    apiConnector.disableProxy();
    handleRetry();
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {/* Direct Connection */}
        <div className={`p-4 rounded-lg ${
          results.directConnection.status === 'connected' ? 'bg-green-50 border border-green-100' :
          results.directConnection.status === 'checking' ? 'bg-yellow-50 border border-yellow-100' :
          'bg-red-50 border border-red-100'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">Direct Connection</h4>
            {results.directConnection.status === 'connected' ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : results.directConnection.status === 'checking' ? (
              <RefreshCw className="text-yellow-500 animate-spin" size={20} />
            ) : (
              <XCircle className="text-red-500" size={20} />
            )}
          </div>
          {results.directConnection.status === 'error' && (
            <div className="text-xs text-red-600 mt-1">
              {results.directConnection.error || 'Connection failed'}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleDisableProxy}
              className={`text-xs ${
                apiConnector.proxyEnabled
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-500 text-white'
              } py-1 px-2 rounded focus:outline-none`}
              disabled={!apiConnector.proxyEnabled}
            >
              {apiConnector.proxyEnabled ? 'Use Direct' : 'Using Direct'}
            </button>
          </div>
        </div>

        {/* CORS Proxy */}
        <div className={`p-4 rounded-lg ${
          results.corsProxy.status === 'connected' ? 'bg-green-50 border border-green-100' :
          results.corsProxy.status === 'checking' ? 'bg-yellow-50 border border-yellow-100' :
          'bg-red-50 border border-red-100'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">CORS Proxy</h4>
            {results.corsProxy.status === 'connected' ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : results.corsProxy.status === 'checking' ? (
              <RefreshCw className="text-yellow-500 animate-spin" size={20} />
            ) : (
              <XCircle className="text-red-500" size={20} />
            )}
          </div>
          {results.corsProxy.status === 'error' && (
            <div className="text-xs text-red-600 mt-1">
              {results.corsProxy.error || 'Proxy not running'}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleEnableProxy}
              className={`text-xs ${
                !apiConnector.proxyEnabled
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-500 text-white'
              } py-1 px-2 rounded focus:outline-none`}
              disabled={apiConnector.proxyEnabled}
            >
              {apiConnector.proxyEnabled ? 'Using Proxy' : 'Use Proxy'}
            </button>
          </div>
        </div>

        {/* API Endpoints */}
        <div className={`p-4 rounded-lg ${
          results.apiEndpoints.status === 'connected' ? 'bg-green-50 border border-green-100' :
          results.apiEndpoints.status === 'checking' ? 'bg-yellow-50 border border-yellow-100' :
          results.apiEndpoints.status === 'partial' ? 'bg-yellow-50 border border-yellow-100' :
          'bg-red-50 border border-red-100'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">API Endpoints</h4>
            {results.apiEndpoints.status === 'connected' ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : results.apiEndpoints.status === 'checking' ? (
              <RefreshCw className="text-yellow-500 animate-spin" size={20} />
            ) : results.apiEndpoints.status === 'partial' ? (
              <CheckCircle className="text-yellow-500" size={20} />
            ) : (
              <XCircle className="text-red-500" size={20} />
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {results.apiEndpoints.status === 'connected' ? 'All endpoints operational' :
             results.apiEndpoints.status === 'checking' ? 'Checking endpoints...' :
             results.apiEndpoints.status === 'partial' ? 'Some endpoints available' :
             'Endpoints unavailable'}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleRetry}
              disabled={isRunningTests}
              className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-2 rounded focus:outline-none disabled:opacity-50 flex items-center"
            >
              {isRunningTests ? (
                <>
                  <RefreshCw size={12} className="mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw size={12} className="mr-1" />
                  Retest
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Connection info */}
      <div className="flex justify-between items-center mt-3">
        <div className="text-sm text-gray-600">
          API Connector: <span className="font-medium">{apiConnector.proxyEnabled ? 'Using CORS proxy' : 'Direct connection'}</span>
        </div>
        <div className="text-sm text-gray-600">
          Auto-switch: <span className="font-medium">{apiConnector.autoSwitchEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectivityTest;
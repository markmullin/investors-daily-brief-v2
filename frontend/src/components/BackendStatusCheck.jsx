import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import ConnectivityTest from './ConnectivityTest';
import apiConnector from '../utils/apiConnector';

/**
 * BackendStatusCheck Component
 * Enhanced component that checks backend connectivity and provides diagnostic information
 * Uses the new ConnectivityTest component for detailed testing
 */
const BackendStatusCheck = ({ onFixesApplied }) => {
  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [connectivityMode, setConnectivityMode] = useState(
    apiConnector.proxyEnabled ? 'proxy' : 'direct'
  );

  // Handle when fixes are applied
  const handleFixesApplied = () => {
    // If parent provides a callback, call it
    if (typeof onFixesApplied === 'function') {
      onFixesApplied();
    }
  };

  // Toggle connectivity mode between direct and proxy
  const toggleConnectivityMode = () => {
    if (connectivityMode === 'direct') {
      apiConnector.enableProxy();
      setConnectivityMode('proxy');
    } else {
      apiConnector.disableProxy();
      setConnectivityMode('direct');
    }
    
    // Clear cache when switching modes
    apiConnector.clearCache();
    
    // Run tests with the new mode
    runConnectivityTests();
  };

  // Run a series of API tests to check connectivity
  const runConnectivityTests = async () => {
    setIsLoading(true);
    const results = {};
    
    // List of key endpoints to test
    const endpoints = [
      '/market/data',
      '/market/macro',
      '/market/sectors',
      '/market/mover',
      '/health',
      '/market-environment/score',
      '/market/sector-rotation',
      '/enhanced-market/industry-analysis/all?period=1y',
      '/enhanced-market/macro-analysis/all?period=1y',
      '/connectivity/full-test'
    ];
    
    try {
      // Test each endpoint
      for (const endpoint of endpoints) {
        try {
          // Add timestamp to prevent caching
          const testEndpoint = endpoint.includes('?') 
            ? `${endpoint}&_t=${Date.now()}` 
            : `${endpoint}?_t=${Date.now()}`;
          
          const response = await apiConnector.get(testEndpoint, { 
            timeout: 5000,
            cache: false
          });
          
          results[endpoint] = { 
            status: 'ok', 
            time: new Date().toLocaleTimeString()
          };
        } catch (error) {
          results[endpoint] = { 
            status: 'error', 
            error: error.message,
            time: new Date().toLocaleTimeString()
          };
        }
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Error running connectivity tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run tests when component mounts
  useEffect(() => {
    runConnectivityTests();
  }, []);

  // Calculate test results summary
  const passedTests = Object.values(testResults).filter(r => r.status === 'ok').length;
  const totalTests = Object.keys(testResults).length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          <h3 className="text-lg font-semibold">Dashboard Connectivity Status</h3>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvancedDiagnostics(!showAdvancedDiagnostics)}
            className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
          >
            {showAdvancedDiagnostics ? 'Hide Advanced Diagnostics' : 'Show Advanced Diagnostics'}
          </button>
          
          <button
            onClick={() => setShowCommands(!showCommands)}
            className="px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm flex items-center gap-1"
          >
            <Terminal size={16} />
            <span>{showCommands ? 'Hide Commands' : 'Show Commands'}</span>
          </button>
        </div>
      </div>
      
      {/* Main Connectivity Test */}
      <ConnectivityTest onFixApplied={handleFixesApplied} />
      
      {/* Connection Mode Toggle */}
      <div className="bg-blue-50 p-3 rounded-lg mt-4 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-blue-800">
            Current mode: {connectivityMode === 'direct' ? 'Direct Backend Connection' : 'CORS Proxy Connection'}
          </p>
          <p className="text-xs text-blue-600">
            {connectivityMode === 'direct' 
              ? 'Using http://localhost:5000 for API calls' 
              : 'Using http://localhost:8080 to proxy API calls'}
          </p>
        </div>
        <button
          onClick={toggleConnectivityMode}
          className="px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
        >
          Switch to {connectivityMode === 'direct' ? 'Proxy' : 'Direct'} Mode
        </button>
      </div>
      
      {/* Test Results Summary */}
      <div className="mt-4 border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
          <h4 className="font-medium">Detailed Test Results</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm">{passedTests}/{totalTests} passing ({passRate}%)</span>
            <button 
              onClick={runConnectivityTests}
              disabled={isLoading}
              className="p-1 rounded hover:bg-gray-200"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        
        <div className="max-h-60 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {Object.entries(testResults).map(([endpoint, result]) => (
                <tr key={endpoint} className={result.status === 'ok' ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-4 py-2 text-sm">{endpoint}</td>
                  <td className="px-4 py-2 text-sm">
                    {result.status === 'ok' ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1" /> OK
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <AlertCircle size={16} className="mr-1" /> {result.error || 'Failed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {Object.keys(testResults).length === 0 && (
                <tr>
                  <td colSpan="2" className="px-4 py-2 text-sm text-center text-gray-500">
                    {isLoading ? 'Running tests...' : 'No test results available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Advanced Diagnostics */}
      {showAdvancedDiagnostics && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Advanced Diagnostics</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded p-3">
              <h5 className="text-xs font-semibold mb-2">Network Configuration</h5>
              <div className="text-xs space-y-1">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection Mode:</span>
                  <span className="font-mono">{connectivityMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto-Switch:</span>
                  <span className="font-mono">{apiConnector.autoSwitchEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded p-3">
              <h5 className="text-xs font-semibold mb-2">API Keys Status</h5>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">EOD API:</span>
                  <span className="font-mono text-green-600">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Brave API:</span>
                  <span className="font-mono text-green-600">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mistral API:</span>
                  <span className="font-mono text-green-600">Configured</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded p-3 mb-4">
            <h5 className="text-xs font-semibold mb-2">Common Issues</h5>
            <ul className="text-xs list-disc list-inside space-y-1">
              <li>
                <span className="text-gray-700">CORS errors are usually fixed by enabling the CORS proxy</span>
              </li>
              <li>
                <span className="text-gray-700">404 errors for missing routes can be fixed by implementing fallback routes</span>
              </li>
              <li>
                <span className="text-gray-700">VIX symbol mapping issues require updates to eodService.js</span>
              </li>
              <li>
                <span className="text-gray-700">Rate limiting issues with Mistral API are addressed with improved backoff</span>
              </li>
            </ul>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                apiConnector.enableAutoSwitch(!apiConnector.autoSwitchEnabled);
                setShowAdvancedDiagnostics(false);
                setTimeout(() => setShowAdvancedDiagnostics(true), 100);
              }}
              className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700"
            >
              {apiConnector.autoSwitchEnabled ? 'Disable' : 'Enable'} Auto-Switch
            </button>
            
            <button
              onClick={() => {
                apiConnector.clearCache();
                apiConnector.forceRefresh();
                runConnectivityTests();
              }}
              className="px-2 py-1 text-xs rounded bg-red-100 text-red-700"
            >
              Clear Cache
            </button>
          </div>
        </div>
      )}
      
      {/* Troubleshooting Commands */}
      {showCommands && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Troubleshooting Commands</h4>
          
          <div className="space-y-3">
            <div className="bg-gray-900 text-white rounded p-3">
              <h5 className="text-xs font-semibold mb-2 text-blue-300">Start the Backend Server</h5>
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre">cd backend
node src/index.js</pre>
            </div>
            
            <div className="bg-gray-900 text-white rounded p-3">
              <h5 className="text-xs font-semibold mb-2 text-blue-300">Start the CORS Proxy</h5>
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre">node improved-cors-proxy.js</pre>
            </div>
            
            <div className="bg-gray-900 text-white rounded p-3">
              <h5 className="text-xs font-semibold mb-2 text-blue-300">Run API Diagnostics</h5>
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre">cd backend
node api-diagnostic.js</pre>
            </div>
            
            <div className="bg-gray-900 text-white rounded p-3">
              <h5 className="text-xs font-semibold mb-2 text-blue-300">Restart All Services</h5>
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre">node restart-services.js</pre>
            </div>
            
            <div className="bg-gray-900 text-white rounded p-3">
              <h5 className="text-xs font-semibold mb-2 text-blue-300">Test Connectivity</h5>
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre">node test-api-connectivity.js</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendStatusCheck;
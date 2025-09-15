import React, { useState, useEffect } from 'react';

const EndpointTest = () => {
  const [sp500Data, setSp500Data] = useState(null);
  const [discoveryData, setDiscoveryData] = useState(null);
  const [sp500Error, setSp500Error] = useState(null);
  const [discoveryError, setDiscoveryError] = useState(null);

  useEffect(() => {
    // Test S&P 500 endpoint
    fetch('http://localhost:5000/api/market/sp500-top')
      .then(res => {
        console.log('S&P 500 Response Status:', res.status);
        return res.text(); // Get as text first to see what we're actually getting
      })
      .then(text => {
        console.log('S&P 500 Raw Response:', text);
        try {
          const data = JSON.parse(text);
          setSp500Data(data);
        } catch (e) {
          setSp500Error(`Parse error: ${e.message}. Response: ${text.substring(0, 200)}`);
        }
      })
      .catch(err => {
        console.error('S&P 500 Fetch Error:', err);
        setSp500Error(err.message);
      });

    // Test Discovery endpoint  
    fetch('http://localhost:5000/api/discovery/all')
      .then(res => {
        console.log('Discovery Response Status:', res.status);
        return res.text();
      })
      .then(text => {
        console.log('Discovery Raw Response:', text);
        try {
          const data = JSON.parse(text);
          setDiscoveryData(data);
        } catch (e) {
          setDiscoveryError(`Parse error: ${e.message}. Response: ${text.substring(0, 200)}`);
        }
      })
      .catch(err => {
        console.error('Discovery Fetch Error:', err);
        setDiscoveryError(err.message);
      });
  }, []);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Endpoint Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">S&P 500 Endpoint Test</h2>
        <p className="text-sm text-gray-600 mb-2">Testing: http://localhost:5000/api/market/sp500-top</p>
        
        {sp500Error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {sp500Error}
          </div>
        ) : sp500Data ? (
          <div>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              ✅ Endpoint is working! Found {Array.isArray(sp500Data) ? sp500Data.length : 0} stocks
            </div>
            {Array.isArray(sp500Data) && (
              <div className="grid grid-cols-3 gap-2">
                {sp500Data.slice(0, 6).map((stock, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded">
                    <span className="font-bold">{stock.symbol}</span>: ${stock.price}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">Loading...</div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Discovery Endpoint Test</h2>
        <p className="text-sm text-gray-600 mb-2">Testing: http://localhost:5000/api/discovery/all</p>
        
        {discoveryError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {discoveryError}
          </div>
        ) : discoveryData ? (
          <div>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              ✅ Endpoint is working! 
            </div>
            {discoveryData.summary && (
              <div className="space-y-2">
                <p>Total Stocks: {discoveryData.summary.totalStocks}</p>
                <p>Market Pulse: {discoveryData.summary.marketPulse} stocks</p>
                <p>Earnings: {discoveryData.summary.earnings} stocks</p>
                <p>Themes: {discoveryData.summary.themes} stocks</p>
                <p>For You: {discoveryData.summary.forYou} stocks</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">Loading...</div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Check Console for Details</h3>
        <p className="text-sm">Open browser DevTools (F12) and check the Console tab for detailed response data</p>
      </div>
    </div>
  );
};

export default EndpointTest;

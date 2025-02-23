import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { marketApi } from '../services/api';

const StockModal = ({ stock, onClose }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (stock && stock.symbol) {
        try {
          setLoading(true);
          const data = await marketApi.getHistory(stock.symbol);
          console.log('Historical data for stock modal:', data);
          setHistoricalData(data || []);
        } catch (error) {
          console.error('Error fetching history:', error);
          setHistoricalData([]);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchHistoricalData();
  }, [stock]);

  if (!stock) return null;

  // Create safe values for metrics (handle null, undefined, etc.)
  const safeStock = {
    symbol: stock.symbol || 'Unknown',
    close: typeof stock.close === 'number' ? stock.close : 0,
    change_p: typeof stock.change_p === 'number' ? stock.change_p : 0,
    volume: stock.volume || 'N/A',
    low: stock.low || stock.close * 0.98 || 0,
    high: stock.high || stock.close * 1.02 || 0,
    previousClose: stock.previousClose || stock.close || 0,
    change: stock.change || 0
  };

  // Format historicalData properly and ensure 200-day MA is included
  const processedHistoricalData = historicalData.map((item, index, array) => {
    // Calculate 200-day moving average if not already present
    let ma200 = item.ma200;
    if (typeof ma200 !== 'number' && index >= 199) {
      // Calculate MA200 as the average of the last 200 data points (including current)
      const window = array.slice(Math.max(0, index - 199), index + 1);
      const sum = window.reduce((acc, d) => acc + (d.price || 0), 0);
      ma200 = sum / window.length;
    }
    
    return {
      ...item,
      price: typeof item.price === 'number' ? item.price : 0,
      date: item.date || new Date().toISOString().split('T')[0],
      ma200: typeof ma200 === 'number' ? ma200 : null
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{safeStock.symbol}</h2>
              <p className="text-3xl font-bold">${Number(safeStock.close).toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2">
                {Number(safeStock.change_p) >= 0 ? (
                  <ArrowUp className="text-green-500" size={24} />
                ) : (
                  <ArrowDown className="text-red-500" size={24} />
                )}
                <span className={Number(safeStock.change_p) >= 0 ? "text-green-500 text-xl" : "text-red-500 text-xl"}>
                  {Number(safeStock.change_p).toFixed(2)}%
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {processedHistoricalData.length > 0 ? (
                <div className="h-96 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedHistoricalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'price') return [`$${Number(value).toFixed(2)}`, 'Price'];
                          if (name === 'ma200') return [`$${Number(value).toFixed(2)}`, '200-day MA'];
                          return [value, name];
                        }}
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        dot={false}
                        name="Price"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ma200" 
                        stroke="#dc2626" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="200-day MA"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border border-gray-200 rounded-lg">
                  <p className="text-gray-500">No historical data available for {safeStock.symbol}</p>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume</p>
              <p className="text-lg font-semibold">
                {typeof safeStock.volume === 'number' 
                  ? Number(safeStock.volume).toLocaleString() 
                  : safeStock.volume}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Day Range</p>
              <p className="text-lg font-semibold">
                ${Number(safeStock.low).toFixed(2)} - ${Number(safeStock.high).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Previous Close</p>
              <p className="text-lg font-semibold">${Number(safeStock.previousClose).toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Change</p>
              <p className="text-lg font-semibold">${Number(safeStock.change).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockModal;
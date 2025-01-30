import React from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StockModal = ({ stock, historicalData, onClose }) => {
  if (!stock) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{stock.symbol}</h2>
              <p className="text-3xl font-bold">${Number(stock.close).toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2">
                {Number(stock.change_p) >= 0 ? (
                  <ArrowUp className="text-green-500" size={24} />
                ) : (
                  <ArrowDown className="text-red-500" size={24} />
                )}
                <span className={Number(stock.change_p) >= 0 ? "text-green-500 text-xl" : "text-red-500 text-xl"}>
                  {Number(stock.change_p).toFixed(2)}%
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
          
          <div className="h-96 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ma200" 
                  stroke="#dc2626" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume</p>
              <p className="text-lg font-semibold">{Number(stock.volume).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Day Range</p>
              <p className="text-lg font-semibold">
                ${Number(stock.low).toFixed(2)} - ${Number(stock.high).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Previous Close</p>
              <p className="text-lg font-semibold">${Number(stock.previousClose).toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Change</p>
              <p className="text-lg font-semibold">${Number(stock.change).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockModal;
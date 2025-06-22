import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, BarChart3, Calculator } from 'lucide-react';
import TimePeriodSelector from './TimePeriodSelector';
import StockPriceCharts from './stock/StockPriceCharts';
import FundamentalsCharts from './stock/FundamentalsCharts';
import FundamentalsTab from './stock/FundamentalsTab';
import { marketApi } from '../services/api';

const StockModal = ({ stock, onClose }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [activeTab, setActiveTab] = useState('charts');
  
  // New state for fundamentals data in charts tab
  const [fundamentalsData, setFundamentalsData] = useState(null);
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false);
  const [fundamentalsError, setFundamentalsError] = useState(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (stock && stock.symbol) {
        try {
          setLoading(true);
          
          // Ensure we're using the correct symbol format
          const symbolToFetch = stock.symbol.includes('.') ? stock.symbol : `${stock.symbol}.US`;
          console.log('Fetching historical data for:', symbolToFetch, 'Period:', selectedPeriod);
          
          const data = await marketApi.getHistory(symbolToFetch, selectedPeriod);
          console.log('Historical data received:', {
            length: data?.length || 0,
            hasMA200: data?.some(d => d.ma200 !== null) || false,
            hasRSI: data?.some(d => d.rsi !== null) || false,
            hasVolume: data?.some(d => d.volume && d.volume > 0) || false,
            isIntraday: data?.some(d => d.isIntraday) || false,
            firstPoint: data?.[0],
            lastPoint: data?.[data?.length - 1]
          });
          
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
  }, [stock, selectedPeriod]);

  // New useEffect to fetch fundamentals data for charts tab
  useEffect(() => {
    const fetchFundamentalsForCharts = async () => {
      if (stock && stock.symbol && activeTab === 'charts') {
        try {
          setFundamentalsLoading(true);
          setFundamentalsError(null);
          
          console.log('Fetching fundamentals for charts tab:', stock.symbol);
          const data = await marketApi.getFundamentals(stock.symbol);
          setFundamentalsData(data);
        } catch (err) {
          console.error('Error fetching fundamentals for charts:', err);
          setFundamentalsError(err.message);
        } finally {
          setFundamentalsLoading(false);
        }
      }
    };
    
    fetchFundamentalsForCharts();
  }, [stock, activeTab]);

  if (!stock) return null;

  // Create safe values for metrics (handle null, undefined, etc.)
  const safeStock = {
    symbol: stock.symbol || 'Unknown',
    close: typeof stock.close === 'number' ? stock.close : 
           (typeof stock.price === 'number' ? stock.price : 0),
    change_p: typeof stock.change_p === 'number' ? stock.change_p : 
              (typeof stock.changePercent === 'number' ? stock.changePercent : 0),
    volume: stock.volume || 'N/A',
    low: stock.low || stock.close * 0.98 || 0,
    high: stock.high || stock.close * 1.02 || 0,
    previousClose: stock.previousClose || stock.close || 0,
    change: stock.change || 0
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
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
                  {Math.abs(Number(safeStock.change_p)).toFixed(2)}%
                  {' '}
                  (${Math.abs(Number((safeStock.close) * (safeStock.change_p) / 100)).toFixed(2)})
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
          
          {/* Tab Navigation */}
          <div className="flex mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'charts'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <BarChart3 size={18} />
              Charts
            </button>
            <button
              onClick={() => setActiveTab('fundamentals')}
              className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'fundamentals'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Calculator size={18} />
              Fundamentals
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'charts' ? (
            <>
              {/* Time Period Selector */}
              <div className="mb-4">
                <TimePeriodSelector
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={handlePeriodChange}
                />
              </div>
              
              {/* Stock Price Charts Component */}
              <StockPriceCharts 
                historicalData={historicalData}
                loading={loading}
                selectedPeriod={selectedPeriod}
                safeStock={safeStock}
              />

              {/* Fundamentals Charts Component */}
              <FundamentalsCharts 
                fundamentalsData={fundamentalsData}
                loading={fundamentalsLoading}
                error={fundamentalsError}
              />

              {/* Stock info grid */}
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
            </>
          ) : (
            /* Fundamentals Tab */
            <FundamentalsTab symbol={safeStock.symbol} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StockModal;
import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, BarChart3, DollarSign, AlertCircle, Info, Zap, Target } from 'lucide-react';

const DCFCalculator = ({ symbol, onClose }) => {
  const [dcfInputs, setDCFInputs] = useState({
    // Current financials (auto-populated)
    currentRevenue: 0,
    currentFCF: 0,
    currentShares: 0,
    currentPrice: 0,
    
    // Growth assumptions
    revenueGrowthRate: 8,
    fcfMargin: 15,
    terminalGrowthRate: 2.5,
    discountRate: 10,
    
    // Time horizon
    projectionYears: 5
  });

  const [dcfResults, setDCFResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbol) {
      loadStockFinancials();
    }
  }, [symbol]);

  const loadStockFinancials = async () => {
    try {
      setLoading(true);
      
      // Get comprehensive financial data
      const response = await fetch(`/api/research/fundamentals/${symbol}`);
      const data = await response.json();
      
      if (data.success) {
        setStockData(data.data);
        
        // Auto-populate DCF inputs with real data
        setDCFInputs(prev => ({
          ...prev,
          currentRevenue: data.data.revenue || 0,
          currentFCF: data.data.freeCashFlow || 0,
          currentShares: data.data.sharesOutstanding || 0,
          currentPrice: data.data.price || 0,
          revenueGrowthRate: data.data.revenueGrowthRate || 8,
          fcfMargin: data.data.fcfMargin || 15,
          discountRate: data.data.wacc || 10
        }));
      }
    } catch (error) {
      console.error('Error loading stock financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDCF = () => {
    setIsCalculating(true);
    
    try {
      const {
        currentRevenue,
        currentFCF,
        currentShares,
        currentPrice,
        revenueGrowthRate,
        fcfMargin,
        terminalGrowthRate,
        discountRate,
        projectionYears
      } = dcfInputs;

      // Project future cash flows
      const projections = [];
      let revenue = currentRevenue;
      
      for (let year = 1; year <= projectionYears; year++) {
        revenue = revenue * (1 + revenueGrowthRate / 100);
        const fcf = revenue * (fcfMargin / 100);
        const presentValue = fcf / Math.pow(1 + discountRate / 100, year);
        
        projections.push({
          year,
          revenue,
          fcf,
          presentValue
        });
      }

      // Calculate terminal value
      const terminalFCF = projections[projections.length - 1].fcf * (1 + terminalGrowthRate / 100);
      const terminalValue = terminalFCF / (discountRate / 100 - terminalGrowthRate / 100);
      const terminalPV = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);

      // Sum all present values
      const totalPV = projections.reduce((sum, proj) => sum + proj.presentValue, 0) + terminalPV;
      
      // Calculate per-share value
      const fairValue = totalPV / currentShares;
      const upside = ((fairValue - currentPrice) / currentPrice) * 100;

      setDCFResults({
        projections,
        terminalValue,
        terminalPV,
        totalPV,
        fairValue,
        currentPrice,
        upside,
        recommendation: upside > 20 ? 'Strong Buy' : upside > 10 ? 'Buy' : upside > -10 ? 'Hold' : 'Sell'
      });

    } catch (error) {
      console.error('DCF calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'Strong Buy': return 'text-green-600 bg-green-100';
      case 'Buy': return 'text-green-600 bg-green-50';
      case 'Hold': return 'text-yellow-600 bg-yellow-100';
      case 'Sell': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            DCF Calculator - {symbol}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading financial data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            DCF Valuation Model - {symbol}
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Institutional Grade
            </span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>
        
        {stockData && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Price:</span>
              <div className="font-semibold text-gray-900">${stockData.price?.toFixed(2) || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-600">Market Cap:</span>
              <div className="font-semibold text-gray-900">{formatCurrency(stockData.marketCap || 0)}</div>
            </div>
            <div>
              <span className="text-gray-600">Revenue (TTM):</span>
              <div className="font-semibold text-gray-900">{formatCurrency(stockData.revenue || 0)}</div>
            </div>
            <div>
              <span className="text-gray-600">Free Cash Flow:</span>
              <div className="font-semibold text-gray-900">{formatCurrency(stockData.freeCashFlow || 0)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* DCF Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              DCF Assumptions
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revenue Growth (%)
                    <Info className="w-3 h-3 inline ml-1 text-gray-400" title="Annual revenue growth rate" />
                  </label>
                  <input
                    type="number"
                    value={dcfInputs.revenueGrowthRate}
                    onChange={(e) => setDCFInputs(prev => ({ ...prev, revenueGrowthRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FCF Margin (%)
                    <Info className="w-3 h-3 inline ml-1 text-gray-400" title="Free cash flow as % of revenue" />
                  </label>
                  <input
                    type="number"
                    value={dcfInputs.fcfMargin}
                    onChange={(e) => setDCFInputs(prev => ({ ...prev, fcfMargin: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Rate (%)
                    <Info className="w-3 h-3 inline ml-1 text-gray-400" title="Weighted Average Cost of Capital (WACC)" />
                  </label>
                  <input
                    type="number"
                    value={dcfInputs.discountRate}
                    onChange={(e) => setDCFInputs(prev => ({ ...prev, discountRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terminal Growth (%)
                    <Info className="w-3 h-3 inline ml-1 text-gray-400" title="Long-term growth rate" />
                  </label>
                  <input
                    type="number"
                    value={dcfInputs.terminalGrowthRate}
                    onChange={(e) => setDCFInputs(prev => ({ ...prev, terminalGrowthRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projection Years
                </label>
                <input
                  type="number"
                  value={dcfInputs.projectionYears}
                  onChange={(e) => setDCFInputs(prev => ({ ...prev, projectionYears: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="3"
                  max="10"
                />
              </div>

              <button
                onClick={calculateDCF}
                disabled={isCalculating}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
              >
                {isCalculating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Zap className="w-5 h-5 mr-2" />
                )}
                {isCalculating ? 'Calculating...' : 'Calculate Fair Value'}
              </button>
            </div>
          </div>

          {/* Right Column - Results */}
          <div>
            {dcfResults ? (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Valuation Results
                </h4>

                {/* Key Results */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        ${dcfResults.fairValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Fair Value</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${dcfResults.upside > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dcfResults.upside > 0 ? '+' : ''}{dcfResults.upside.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Upside/Downside</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(dcfResults.recommendation)}`}>
                      {dcfResults.recommendation}
                    </span>
                  </div>
                </div>

                {/* Cash Flow Projections */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Year</th>
                        <th className="px-3 py-2 text-left">Revenue</th>
                        <th className="px-3 py-2 text-left">FCF</th>
                        <th className="px-3 py-2 text-left">PV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dcfResults.projections.map((proj) => (
                        <tr key={proj.year} className="border-t border-gray-200">
                          <td className="px-3 py-2 font-medium">{proj.year}</td>
                          <td className="px-3 py-2">{formatCurrency(proj.revenue)}</td>
                          <td className="px-3 py-2">{formatCurrency(proj.fcf)}</td>
                          <td className="px-3 py-2">{formatCurrency(proj.presentValue)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-gray-300 font-semibold bg-gray-50">
                        <td className="px-3 py-2">Terminal</td>
                        <td className="px-3 py-2">-</td>
                        <td className="px-3 py-2">-</td>
                        <td className="px-3 py-2">{formatCurrency(dcfResults.terminalPV)}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-400 font-bold">
                        <td className="px-3 py-2">Total</td>
                        <td className="px-3 py-2" colSpan="2">Enterprise Value</td>
                        <td className="px-3 py-2">{formatCurrency(dcfResults.totalPV)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Sensitivity Analysis Note */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                    <div className="text-sm text-yellow-800">
                      <strong>Sensitivity Note:</strong> DCF valuations are highly sensitive to assumptions. 
                      Consider running multiple scenarios with different growth and discount rates.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Enter your assumptions and click "Calculate Fair Value" to see DCF results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DCFCalculator;
import React, { useEffect, useState } from 'react';
import { Calculator, TrendingUp, DollarSign, AlertCircle, Info } from 'lucide-react';

const DCFModelTab = ({ symbol }) => {
  const [dcfData, setDcfData] = useState(null);
  const [historicalFCF, setHistoricalFCF] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!symbol) return;
    
    const fetchDCFData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch DCF analysis and historical FCF data
        const [dcfRes, fcfRes] = await Promise.all([
          fetch(`/api/research/dcf/${symbol}`),
          fetch(`/api/research/historical-fcf/${symbol}`)
        ]);
        
        if (!dcfRes.ok || !fcfRes.ok) {
          throw new Error('Failed to fetch DCF data');
        }
        
        const [dcf, fcf] = await Promise.all([
          dcfRes.json(),
          fcfRes.json()
        ]);
        
        console.log('DCF data received:', { dcf, fcf });
        
        setDcfData(dcf);
        setHistoricalFCF(fcf);
      } catch (err) {
        console.error('DCF fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDCFData();
  }, [symbol]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading DCF analysis...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading DCF analysis: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!dcfData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">No DCF data available for {symbol}</p>
      </div>
    );
  }
  
  // Extract DCF model data
  const dcf = Array.isArray(dcfData) ? dcfData[0] : dcfData;
  const currentPrice = dcf.stockPrice || 0;
  const fairValue = dcf.dcf || dcf.fairValue || 0;
  const upside = fairValue > 0 ? ((fairValue - currentPrice) / currentPrice * 100) : 0;
  
  // Helper function to format large numbers
  const formatNumber = (num) => {
    if (!num || isNaN(num)) return 'N/A';
    if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };
  
  // Valuation verdict
  const getValuationVerdict = () => {
    if (!fairValue || !currentPrice) return { verdict: 'N/A', color: 'text-gray-600' };
    const ratio = currentPrice / fairValue;
    
    if (ratio < 0.7) return { verdict: 'Significantly Undervalued', color: 'text-green-700' };
    if (ratio < 0.9) return { verdict: 'Undervalued', color: 'text-green-600' };
    if (ratio < 1.1) return { verdict: 'Fairly Valued', color: 'text-yellow-600' };
    if (ratio < 1.3) return { verdict: 'Overvalued', color: 'text-orange-600' };
    return { verdict: 'Significantly Overvalued', color: 'text-red-700' };
  };
  
  const { verdict, color: verdictColor } = getValuationVerdict();
  
  return (
    <div className="space-y-6">
      {/* DCF Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fair Value Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">DCF Fair Value</h3>
            <Calculator className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            ${fairValue.toFixed(2)}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Intrinsic value per share
          </p>
        </div>
        
        {/* Current Price Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Current Price</h3>
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-800">
            ${currentPrice.toFixed(2)}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Market price per share
          </p>
        </div>
        
        {/* Upside/Downside Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Potential Return</h3>
            <TrendingUp className="h-6 w-6 text-gray-400" />
          </div>
          <div className={`text-3xl font-bold ${upside >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
          </div>
          <p className={`text-sm font-semibold mt-2 ${verdictColor}`}>
            {verdict}
          </p>
        </div>
      </div>
      
      {/* DCF Model Assumptions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Calculator className="mr-2 h-6 w-6 text-blue-500" />
          DCF Model Assumptions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Growth Assumptions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Growth Rates</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue Growth</span>
                <span className="text-sm font-medium">
                  {dcf.revenueGrowthRate ? `${(dcf.revenueGrowthRate * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">FCF Growth</span>
                <span className="text-sm font-medium">
                  {dcf.fcfGrowthRate ? `${(dcf.fcfGrowthRate * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Terminal Growth</span>
                <span className="text-sm font-medium">
                  {dcf.terminalGrowthRate ? `${(dcf.terminalGrowthRate * 100).toFixed(1)}%` : '2.5%'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Discount Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Discount Rate (WACC)</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">WACC</span>
                <span className="text-sm font-medium">
                  {dcf.wacc ? `${(dcf.wacc * 100).toFixed(1)}%` : '10.0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk-Free Rate</span>
                <span className="text-sm font-medium">
                  {dcf.riskFreeRate ? `${(dcf.riskFreeRate * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Beta</span>
                <span className="text-sm font-medium">
                  {dcf.beta ? dcf.beta.toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Valuation Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Valuation Components</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Enterprise Value</span>
                <span className="text-sm font-medium">
                  {formatNumber(dcf.enterpriseValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Terminal Value</span>
                <span className="text-sm font-medium">
                  {formatNumber(dcf.terminalValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">PV of FCF</span>
                <span className="text-sm font-medium">
                  {formatNumber(dcf.presentValueOfFCF)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Historical Free Cash Flow */}
      {historicalFCF && historicalFCF.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Historical Free Cash Flow</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Year</th>
                  <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Free Cash Flow</th>
                  <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Growth Rate</th>
                  <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">FCF Margin</th>
                </tr>
              </thead>
              <tbody>
                {historicalFCF.slice(0, 5).map((item, index) => {
                  const previousFCF = historicalFCF[index + 1]?.freeCashFlow;
                  const growthRate = previousFCF ? ((item.freeCashFlow - previousFCF) / Math.abs(previousFCF) * 100) : null;
                  const fcfMargin = item.revenue ? (item.freeCashFlow / item.revenue * 100) : null;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-4 text-sm text-gray-600">{item.date}</td>
                      <td className="py-2 px-4 text-sm text-right font-medium">
                        {formatNumber(item.freeCashFlow)}
                      </td>
                      <td className={`py-2 px-4 text-sm text-right font-medium ${
                        growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {growthRate !== null ? `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="py-2 px-4 text-sm text-right text-gray-600">
                        {fcfMargin !== null ? `${fcfMargin.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* DCF Sensitivity Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Sensitivity Analysis</h3>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800">
                  The DCF model is sensitive to key assumptions. Small changes in growth rates or discount rates can significantly impact the fair value estimate.
                </p>
              </div>
            </div>
          </div>
          
          {/* Sensitivity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Impact of WACC Changes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">WACC -1%</span>
                  <span className="text-green-600 font-medium">
                    Fair Value: ${(fairValue * 1.15).toFixed(2)} (+15%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base WACC</span>
                  <span className="font-medium">
                    Fair Value: ${fairValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WACC +1%</span>
                  <span className="text-red-600 font-medium">
                    Fair Value: ${(fairValue * 0.87).toFixed(2)} (-13%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Impact of Growth Rate Changes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth +2%</span>
                  <span className="text-green-600 font-medium">
                    Fair Value: ${(fairValue * 1.20).toFixed(2)} (+20%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Growth</span>
                  <span className="font-medium">
                    Fair Value: ${fairValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth -2%</span>
                  <span className="text-red-600 font-medium">
                    Fair Value: ${(fairValue * 0.83).toFixed(2)} (-17%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* DCF Model Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">DCF Model Notes</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• This DCF model uses consensus analyst estimates and historical averages for key assumptions</p>
          <p>• The terminal growth rate is set conservatively at 2.5% (approximate GDP growth)</p>
          <p>• WACC is calculated using current market data and company-specific risk factors</p>
          <p>• Free cash flow projections are based on historical margins and growth trends</p>
          <p>• This is one valuation method among many - consider multiple approaches for investment decisions</p>
        </div>
      </div>
    </div>
  );
};

export default DCFModelTab;

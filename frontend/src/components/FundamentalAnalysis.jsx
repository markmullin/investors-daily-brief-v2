import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Building2, FileText, DollarSign, BarChart3, Users } from 'lucide-react';

const FundamentalAnalysis = ({ symbol }) => {
  const [fundamentalData, setFundamentalData] = useState(null);
  const [filings, setFilings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (symbol) {
      fetchFundamentalData();
    }
  }, [symbol]);

  const fetchFundamentalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch fundamental data and filings in parallel
      const [fundamentalsResponse, filingsResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/edgar/fundamentals/${symbol}`),
        fetch(`http://localhost:5000/api/edgar/filings/${symbol}`)
      ]);

      if (!fundamentalsResponse.ok || !filingsResponse.ok) {
        throw new Error('Failed to fetch SEC data');
      }

      const fundamentals = await fundamentalsResponse.json();
      const filingsData = await filingsResponse.json();

      setFundamentalData(fundamentals);
      setFilings(filingsData);
    } catch (err) {
      console.error('Error fetching fundamental data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Unable to load fundamental data: {error}</span>
        </div>
      </div>
    );
  }

  if (!fundamentalData) {
    return null;
  }

  const { fundamentals, fiscalData, companyName, currentPrice } = fundamentalData;

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
            <p className="text-gray-600">{symbol} - Fundamental Analysis</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">${currentPrice?.toFixed(2) || 'N/A'}</p>
            <p className="text-sm text-gray-500">Current Price</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'financials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Financials
          </button>
          <button
            onClick={() => setActiveTab('filings')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'filings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            SEC Filings
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Valuation Metrics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="text-blue-500" size={20} />
                Valuation Metrics
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">P/E Ratio</span>
                  <span className="font-medium">{fundamentals.pe?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P/B Ratio</span>
                  <span className="font-medium">{fundamentals.pb?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">EPS</span>
                  <span className="font-medium">${fundamentals.eps?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Book Value/Share</span>
                  <span className="font-medium">${fundamentals.bookValuePerShare?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Profitability Metrics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                Profitability
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue Growth</span>
                  <span className={`font-medium ${fundamentals.revenueGrowthYoY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(fundamentals.revenueGrowthYoY)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-medium">{formatPercent(fundamentals.profitMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ROE</span>
                  <span className="font-medium">{formatPercent(fundamentals.roe)}</span>
                </div>
              </div>
            </div>

            {/* Financial Health */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building2 className="text-purple-500" size={20} />
                Financial Health
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Debt/Equity</span>
                  <span className="font-medium">{fundamentals.debtToEquity?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asset/Liability</span>
                  <span className="font-medium">{fundamentals.assetToLiabilityRatio?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Revenue Trend */}
            {fiscalData.Revenues && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Revenue Trend (Annual)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Year</th>
                        <th className="text-right py-2">Revenue</th>
                        <th className="text-right py-2">YoY Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiscalData.Revenues.annual.slice(-5).map((item, index, array) => {
                        const prevRevenue = index > 0 ? array[index - 1].val : null;
                        const change = prevRevenue ? ((item.val - prevRevenue) / prevRevenue) * 100 : null;
                        
                        return (
                          <tr key={item.fy} className="border-b">
                            <td className="py-2">{item.fy}</td>
                            <td className="text-right">{formatNumber(item.val)}</td>
                            <td className={`text-right ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change !== null ? `${change.toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Net Income Trend */}
            {fiscalData.NetIncomeLoss && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Net Income Trend (Annual)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Year</th>
                        <th className="text-right py-2">Net Income</th>
                        <th className="text-right py-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiscalData.NetIncomeLoss.annual.slice(-5).map((item, index) => {
                        const revenue = fiscalData.Revenues?.annual.find(r => r.fy === item.fy)?.val;
                        const margin = revenue ? (item.val / revenue) * 100 : null;
                        
                        return (
                          <tr key={item.fy} className="border-b">
                            <td className="py-2">{item.fy}</td>
                            <td className={`text-right ${item.val >= 0 ? '' : 'text-red-600'}`}>
                              {formatNumber(item.val)}
                            </td>
                            <td className="text-right">
                              {margin !== null ? `${margin.toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'filings' && filings && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent SEC Filings</h3>
            <div className="space-y-3">
              {filings.filings.slice(0, 10).map((filing, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="text-gray-400 mt-1" size={20} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{filing.form}</span>
                          {filing.form === '10-K' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Annual Report</span>
                          )}
                          {filing.form === '10-Q' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Quarterly Report</span>
                          )}
                          {filing.form === '8-K' && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Current Report</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Filed: {formatDate(filing.filingDate)} | Report Date: {formatDate(filing.reportDate)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={filing.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundamentalAnalysis;

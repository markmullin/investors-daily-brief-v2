import React, { useState, useEffect } from 'react';
import { BarChart2, PieChart, TrendingUp, AlertCircle, RefreshCw, Users, Target, Award, DollarSign, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const PortfolioComparison = ({ userPortfolio, smartMoneyPortfolio, isOpen, onClose }) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, holdings, sectors, performance

  useEffect(() => {
    if (isOpen && userPortfolio && smartMoneyPortfolio) {
      analyzePortfolios();
    }
  }, [isOpen, userPortfolio, smartMoneyPortfolio]);

  const analyzePortfolios = () => {
    setLoading(true);
    
    // Calculate overlap
    const userSymbols = new Set(userPortfolio.holdings?.map(h => h.symbol) || []);
    const smartSymbols = new Set(smartMoneyPortfolio.allHoldings?.map(h => h.symbol) || []);
    
    const overlap = [...userSymbols].filter(symbol => smartSymbols.has(symbol));
    const uniqueToUser = [...userSymbols].filter(symbol => !smartSymbols.has(symbol));
    const uniqueToSmart = [...smartSymbols].filter(symbol => !userSymbols.has(symbol));
    
    // Calculate sector allocations
    const userSectors = calculateSectorAllocation(userPortfolio.holdings || []);
    const smartSectors = calculateSectorAllocation(smartMoneyPortfolio.allHoldings || []);
    
    // Calculate concentration metrics
    const userTop10Weight = calculateTopWeight(userPortfolio.holdings || [], 10);
    const smartTop10Weight = calculateTopWeight(smartMoneyPortfolio.allHoldings || [], 10);
    
    setComparisonData({
      overlap: {
        shared: overlap,
        uniqueToUser,
        uniqueToSmart,
        overlapPercentage: (overlap.length / userSymbols.size * 100).toFixed(1)
      },
      sectors: {
        user: userSectors,
        smart: smartSectors
      },
      concentration: {
        userTop10: userTop10Weight,
        smartTop10: smartTop10Weight,
        userHoldings: userPortfolio.holdings?.length || 0,
        smartHoldings: smartMoneyPortfolio.holdingsCount || 0
      }
    });
    
    setLoading(false);
  };

  const calculateSectorAllocation = (holdings) => {
    const sectors = {};
    let totalValue = 0;
    
    holdings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      const value = holding.marketValue || holding.value || 0;
      sectors[sector] = (sectors[sector] || 0) + value;
      totalValue += value;
    });
    
    // Convert to percentages
    Object.keys(sectors).forEach(sector => {
      sectors[sector] = (sectors[sector] / totalValue * 100).toFixed(1);
    });
    
    return sectors;
  };

  const calculateTopWeight = (holdings, n) => {
    const sorted = [...holdings].sort((a, b) => 
      (b.marketValue || b.value || 0) - (a.marketValue || a.value || 0)
    );
    
    const topN = sorted.slice(0, n);
    const totalValue = holdings.reduce((sum, h) => sum + (h.marketValue || h.value || 0), 0);
    const topValue = topN.reduce((sum, h) => sum + (h.marketValue || h.value || 0), 0);
    
    return (topValue / totalValue * 100).toFixed(1);
  };

  const formatValue = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <BarChart2 className="w-8 h-8 mr-3" />
                Portfolio Comparison
              </h2>
              <p className="text-blue-100 mt-1">
                Your portfolio vs {smartMoneyPortfolio.managerName || smartMoneyPortfolio.institutionName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* View Mode Tabs */}
          <div className="flex space-x-1 mt-6">
            {['overview', 'holdings', 'sectors', 'performance'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  viewMode === mode 
                    ? 'bg-white text-blue-600 font-semibold' 
                    : 'text-blue-100 hover:text-white hover:bg-blue-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Analyzing portfolios...</span>
            </div>
          ) : comparisonData && (
            <>
              {/* Overview Tab */}
              {viewMode === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overlap Score */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <Target className="w-8 h-8 text-purple-600" />
                        <span className="text-3xl font-bold text-purple-700">
                          {comparisonData.overlap.overlapPercentage}%
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">Portfolio Overlap</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {comparisonData.overlap.shared.length} shared holdings
                      </p>
                    </div>

                    {/* Concentration */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <PieChart className="w-8 h-8 text-blue-600" />
                        <div className="text-right">
                          <div className="text-lg font-semibold text-blue-700">
                            You: {comparisonData.concentration.userTop10}%
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {smartMoneyPortfolio.managerName?.split(' ')[1] || 'Smart'}: {comparisonData.concentration.smartTop10}%
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">Top 10 Concentration</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Portfolio concentration comparison
                      </p>
                    </div>

                    {/* Holdings Count */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-green-600" />
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-700">
                            You: {comparisonData.concentration.userHoldings}
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            {smartMoneyPortfolio.managerName?.split(' ')[1] || 'Smart'}: {comparisonData.concentration.smartHoldings}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">Total Holdings</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Diversification comparison
                      </p>
                    </div>
                  </div>

                  {/* Shared Holdings */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Award className="w-6 h-6 mr-2 text-yellow-500" />
                      Shared Holdings with {smartMoneyPortfolio.managerName}
                    </h3>
                    
                    {comparisonData.overlap.shared.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {comparisonData.overlap.shared.map((symbol) => (
                          <div key={symbol} className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
                            <span className="font-bold text-green-700">{symbol}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No shared holdings</p>
                    )}
                  </div>

                  {/* Investment Style Match */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Investment Style Analysis
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Portfolio Concentration</span>
                        <span className={`font-semibold ${
                          Math.abs(comparisonData.concentration.userTop10 - comparisonData.concentration.smartTop10) < 10
                            ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {Math.abs(comparisonData.concentration.userTop10 - comparisonData.concentration.smartTop10) < 10
                            ? 'Similar' : 'Different'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Diversification Level</span>
                        <span className={`font-semibold ${
                          Math.abs(comparisonData.concentration.userHoldings - comparisonData.concentration.smartHoldings) < 20
                            ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {Math.abs(comparisonData.concentration.userHoldings - comparisonData.concentration.smartHoldings) < 20
                            ? 'Similar' : 'Different'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Holdings Tab */}
              {viewMode === 'holdings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Unique to You */}
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                        Unique to Your Portfolio
                        <span className="ml-2 text-sm text-gray-600">
                          ({comparisonData.overlap.uniqueToUser.length})
                        </span>
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {comparisonData.overlap.uniqueToUser.map((symbol) => (
                          <div key={symbol} className="bg-white rounded-lg px-3 py-2 text-sm border border-blue-100">
                            <span className="font-semibold text-blue-700">{symbol}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shared */}
                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-green-600" />
                        Shared Holdings
                        <span className="ml-2 text-sm text-gray-600">
                          ({comparisonData.overlap.shared.length})
                        </span>
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {comparisonData.overlap.shared.map((symbol) => (
                          <div key={symbol} className="bg-white rounded-lg px-3 py-2 text-sm border border-green-100">
                            <span className="font-bold text-green-700">{symbol}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unique to Smart Money */}
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-purple-600" />
                        {smartMoneyPortfolio.managerName}'s Unique
                        <span className="ml-2 text-sm text-gray-600">
                          ({comparisonData.overlap.uniqueToSmart.length})
                        </span>
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {comparisonData.overlap.uniqueToSmart.slice(0, 20).map((symbol) => (
                          <div key={symbol} className="bg-white rounded-lg px-3 py-2 text-sm border border-purple-100">
                            <span className="font-semibold text-purple-700">{symbol}</span>
                          </div>
                        ))}
                        {comparisonData.overlap.uniqueToSmart.length > 20 && (
                          <p className="text-sm text-gray-500 italic">
                            +{comparisonData.overlap.uniqueToSmart.length - 20} more...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                      Key Insights
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      {comparisonData.overlap.overlapPercentage > 30 && (
                        <p>• You share significant holdings with {smartMoneyPortfolio.managerName}, suggesting similar investment philosophy.</p>
                      )}
                      {comparisonData.overlap.overlapPercentage < 10 && (
                        <p>• Your portfolio has minimal overlap with {smartMoneyPortfolio.managerName}, indicating different investment approaches.</p>
                      )}
                      {comparisonData.concentration.userHoldings < comparisonData.concentration.smartHoldings / 2 && (
                        <p>• Consider diversifying more - {smartMoneyPortfolio.managerName} holds {comparisonData.concentration.smartHoldings} positions vs your {comparisonData.concentration.userHoldings}.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sectors Tab */}
              {viewMode === 'sectors' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Sector Allocation Comparison
                    </h3>
                    
                    <div className="space-y-4">
                      {Object.keys({...comparisonData.sectors.user, ...comparisonData.sectors.smart})
                        .filter((sector, index, self) => self.indexOf(sector) === index)
                        .sort((a, b) => (comparisonData.sectors.smart[b] || 0) - (comparisonData.sectors.smart[a] || 0))
                        .map((sector) => {
                          const userWeight = parseFloat(comparisonData.sectors.user[sector] || 0);
                          const smartWeight = parseFloat(comparisonData.sectors.smart[sector] || 0);
                          const diff = userWeight - smartWeight;
                          
                          return (
                            <div key={sector} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{sector}</span>
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm text-gray-600">
                                    You: {userWeight.toFixed(1)}%
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {smartMoneyPortfolio.managerName?.split(' ')[1]}: {smartWeight.toFixed(1)}%
                                  </span>
                                  <span className={`text-sm font-semibold flex items-center ${
                                    Math.abs(diff) < 2 ? 'text-gray-500' :
                                    diff > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {diff > 0 && <ArrowUpRight className="w-4 h-4" />}
                                    {diff < 0 && <ArrowDownRight className="w-4 h-4" />}
                                    {Math.abs(diff) < 2 && <Minus className="w-4 h-4" />}
                                    {Math.abs(diff).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              
                              {/* Visual Comparison Bars */}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500 w-16">You</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${userWeight}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500 w-16">Smart</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-purple-600 h-2 rounded-full"
                                      style={{ width: `${smartWeight}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Sector Insights */}
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                      Sector Allocation Insights
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• {smartMoneyPortfolio.managerName} appears to favor {smartMoneyPortfolio.style} investments.</p>
                      <p>• Consider rebalancing sectors where you significantly differ from institutional allocations.</p>
                      <p>• Remember that different investment styles and time horizons may warrant different sector weights.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {viewMode === 'performance' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="w-6 h-6 mr-2 text-yellow-600" />
                      Performance Tracking Coming Soon
                    </h3>
                    <p className="text-gray-700">
                      We're building advanced performance analytics to show:
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600">
                      <li>• Historical performance comparison</li>
                      <li>• Risk-adjusted returns (Sharpe ratio)</li>
                      <li>• Win rate on shared holdings</li>
                      <li>• Best and worst performing positions</li>
                      <li>• Timing analysis of smart money moves</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioComparison;
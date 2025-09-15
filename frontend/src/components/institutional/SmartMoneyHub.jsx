import React, { useState, useEffect } from 'react';
import { Building2, TrendingUp, Target, AlertTriangle, Users, Sparkles, Eye, ArrowUpRight, Filter, Search, Copy, Bell, BarChart3, BookOpen, Award, ChevronDown } from 'lucide-react';
import InstitutionalPortfoliosCarousel from './InstitutionalPortfoliosCarousel';

const SmartMoneyHub = ({ userPortfolio }) => {
  const [activeView, setActiveView] = useState('managers'); // managers, overlap, conviction, activity, clone
  const [overlapData, setOverlapData] = useState(null);
  const [convictionPicks, setConvictionPicks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch overlap analysis
  const fetchOverlapAnalysis = async () => {
    if (!userPortfolio?.holdings || Object.keys(userPortfolio.holdings).length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockOverlap = {
        totalOverlap: 12,
        overlapPercentage: 35,
        topOverlaps: [
          {
            symbol: 'AAPL',
            company: 'Apple Inc.',
            userWeight: 8.5,
            managers: [
              { name: 'Warren Buffett', weight: 45.2, institution: 'Berkshire Hathaway' },
              { name: 'Cathie Wood', weight: 6.3, institution: 'ARK Invest' },
              { name: 'Ray Dalio', weight: 3.1, institution: 'Bridgewater' }
            ]
          },
          {
            symbol: 'MSFT',
            company: 'Microsoft Corp.',
            userWeight: 6.2,
            managers: [
              { name: 'Bill Ackman', weight: 12.5, institution: 'Pershing Square' },
              { name: 'Seth Klarman', weight: 8.7, institution: 'Baupost Group' }
            ]
          },
          {
            symbol: 'GOOGL',
            company: 'Alphabet Inc.',
            userWeight: 5.1,
            managers: [
              { name: 'Dan Loeb', weight: 7.3, institution: 'Third Point' },
              { name: 'Steve Cohen', weight: 4.2, institution: 'Point72' }
            ]
          }
        ],
        uniqueToUser: ['TSLA', 'AMD', 'NVDA'],
        missedByUser: [
          { symbol: 'BRK.B', managers: 8, avgWeight: 4.2 },
          { symbol: 'JPM', managers: 6, avgWeight: 3.8 },
          { symbol: 'UNH', managers: 5, avgWeight: 3.5 }
        ]
      };
      setOverlapData(mockOverlap);
    } catch (error) {
      console.error('Error fetching overlap analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch conviction picks
  const fetchConvictionPicks = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockConviction = [
        {
          symbol: 'AAPL',
          company: 'Apple Inc.',
          managersCount: 15,
          avgPosition: 12.3,
          topConviction: [
            { manager: 'Warren Buffett', position: 45.2, change: '+2.1%' },
            { manager: 'Bill Ackman', position: 8.7, change: '+15.3%' }
          ],
          consensus: 'Strong Buy'
        },
        {
          symbol: 'META',
          company: 'Meta Platforms',
          managersCount: 12,
          avgPosition: 8.7,
          topConviction: [
            { manager: 'Dan Loeb', position: 15.3, change: 'NEW' },
            { manager: 'Steve Cohen', position: 9.2, change: '+5.7%' }
          ],
          consensus: 'Buy'
        },
        {
          symbol: 'NVDA',
          company: 'NVIDIA Corp.',
          managersCount: 18,
          avgPosition: 6.5,
          topConviction: [
            { manager: 'Cathie Wood', position: 11.2, change: '-3.2%' },
            { manager: 'Ken Griffin', position: 7.8, change: '+8.9%' }
          ],
          consensus: 'Strong Buy'
        }
      ];
      setConvictionPicks(mockConviction);
    } catch (error) {
      console.error('Error fetching conviction picks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockActivity = [
        {
          date: '2025-01-28',
          manager: 'Warren Buffett',
          institution: 'Berkshire Hathaway',
          action: 'BOUGHT',
          symbol: 'CVX',
          company: 'Chevron Corp.',
          shares: '123M',
          value: '$18.6B',
          change: 'NEW',
          impact: 'high'
        },
        {
          date: '2025-01-27',
          manager: 'Michael Burry',
          institution: 'Scion Asset Management',
          action: 'SOLD',
          symbol: 'TSLA',
          company: 'Tesla Inc.',
          shares: '50K',
          value: '$10M',
          change: '-100%',
          impact: 'medium'
        },
        {
          date: '2025-01-26',
          manager: 'Cathie Wood',
          institution: 'ARK Invest',
          action: 'INCREASED',
          symbol: 'ROKU',
          company: 'Roku Inc.',
          shares: '2.5M',
          value: '$150M',
          change: '+35%',
          impact: 'high'
        },
        {
          date: '2025-01-25',
          manager: 'Bill Ackman',
          institution: 'Pershing Square',
          action: 'REDUCED',
          symbol: 'HLT',
          company: 'Hilton Worldwide',
          shares: '1M',
          value: '$180M',
          change: '-20%',
          impact: 'low'
        }
      ];
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'overlap') {
      fetchOverlapAnalysis();
    } else if (activeView === 'conviction') {
      fetchConvictionPicks();
    } else if (activeView === 'activity') {
      fetchRecentActivity();
    }
  }, [activeView, userPortfolio]);

  // Filter functions
  const filterByStrategy = (data) => {
    if (selectedStrategy === 'all') return data;
    // Add strategy filtering logic here
    return data;
  };

  const filterBySearch = (data) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manager?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  const OverlapAnalysis = () => (
    <div className="space-y-6">
      {!userPortfolio?.holdings || Object.keys(userPortfolio.holdings).length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Portfolio First</h3>
          <p className="text-gray-600">To see which stocks you share with smart money managers, please upload your portfolio CSV.</p>
        </div>
      ) : overlapData ? (
        <>
          {/* Overlap Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-green-600">{overlapData.totalOverlap}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Shared Holdings</h4>
              <p className="text-sm text-gray-600 mt-1">Stocks you own that smart money also owns</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">{overlapData.overlapPercentage}%</span>
              </div>
              <h4 className="font-semibold text-gray-900">Portfolio Overlap</h4>
              <p className="text-sm text-gray-600 mt-1">Percentage of your portfolio in smart money stocks</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-600">{overlapData.missedByUser.length}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Consider Adding</h4>
              <p className="text-sm text-gray-600 mt-1">Popular smart money picks you don't own</p>
            </div>
          </div>

          {/* Top Overlapping Holdings */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Your Holdings That Smart Money Also Owns
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {overlapData.topOverlaps.map((holding, index) => (
                <div key={index} className="p-6 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xl font-bold text-blue-600">{holding.symbol}</span>
                      <span className="ml-3 text-gray-600">{holding.company}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Your Weight</div>
                      <div className="text-lg font-semibold text-gray-900">{holding.userWeight}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {holding.managers.map((manager, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {manager.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{manager.name}</div>
                            <div className="text-xs text-gray-500">{manager.institution}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">{manager.weight}%</div>
                          <div className="text-xs text-gray-500">position</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stocks to Consider */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-orange-600" />
              Smart Money Favorites You're Missing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overlapData.missedByUser.map((stock, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-orange-600">{stock.symbol}</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      {stock.managers} managers
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg position: <span className="font-semibold text-gray-900">{stock.avgWeight}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );

  const ConvictionPicks = () => (
    <div className="space-y-6">
      {/* Conviction Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            High Conviction Picks
            <span className="ml-2 text-sm text-purple-600">Stocks where multiple managers have {'>'}5% positions</span>
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="px-3 py-1 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Strategies</option>
              <option value="value">Value Investing</option>
              <option value="growth">Growth/Tech</option>
              <option value="activist">Activist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conviction Picks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {convictionPicks.map((pick, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-2xl font-bold text-blue-600">{pick.symbol}</span>
                  <div className="text-sm text-gray-600 mt-1">{pick.company}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  pick.consensus === 'Strong Buy' ? 'bg-green-100 text-green-700' :
                  pick.consensus === 'Buy' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {pick.consensus}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Managers Holding</span>
                  <span className="font-semibold text-gray-900">{pick.managersCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Avg Position Size</span>
                  <span className="font-semibold text-purple-600">{pick.avgPosition}%</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Top Conviction:</div>
                {pick.topConviction.map((manager, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{manager.manager}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{manager.position}%</span>
                      <span className={`text-xs ${
                        manager.change === 'NEW' ? 'text-green-600 font-bold' :
                        manager.change.startsWith('+') ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {manager.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const RecentActivity = () => (
    <div className="space-y-6">
      {/* Activity Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            Latest Smart Money Moves
            <span className="ml-2 text-sm text-blue-600">Real-time 13F filing updates</span>
          </h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filterBySearch(recentActivity).map((activity, index) => (
            <div key={index} className={`p-6 hover:bg-gray-50 transition-colors ${
              activity.impact === 'high' ? 'border-l-4 border-l-red-500' : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activity.action === 'BOUGHT' ? 'bg-green-100 text-green-700' :
                      activity.action === 'SOLD' ? 'bg-red-100 text-red-700' :
                      activity.action === 'INCREASED' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {activity.action}
                    </span>
                    <span className="text-sm text-gray-500">{activity.date}</span>
                    {activity.impact === 'high' && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                        HIGH IMPACT
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-semibold text-gray-900">{activity.manager}</span>
                    <span className="text-gray-500 text-sm ml-2">({activity.institution})</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-xl font-bold text-blue-600">{activity.symbol}</span>
                      <span className="ml-2 text-gray-600">{activity.company}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{activity.value}</div>
                  <div className="text-sm text-gray-500">{activity.shares} shares</div>
                  <div className={`text-sm font-semibold mt-1 ${
                    activity.change === 'NEW' ? 'text-green-600' :
                    activity.change.startsWith('+') ? 'text-green-600' :
                    activity.change.startsWith('-') ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {activity.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PortfolioCloning = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8 border border-indigo-200 text-center">
        <Copy className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Clone a Smart Money Portfolio</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Replicate the exact allocation of legendary investors with one click. Choose a manager, set your investment amount, and we'll calculate the exact shares needed.
        </p>
        <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
          Browse Managers to Clone
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex space-x-2 overflow-x-auto">
          {[
            { id: 'managers', label: 'Manager Profiles', icon: Building2, description: 'Browse legendary investors' },
            { id: 'overlap', label: 'Portfolio Overlap', icon: BarChart3, description: 'Compare with your holdings' },
            { id: 'conviction', label: 'Conviction Picks', icon: Target, description: 'High confidence positions' },
            { id: 'activity', label: 'Recent Activity', icon: Bell, description: 'Latest trades & filings' },
            { id: 'clone', label: 'Clone Portfolio', icon: Copy, description: 'Replicate smart money' }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex flex-col items-center px-6 py-3 rounded-lg transition-colors whitespace-nowrap min-w-[140px] ${
                  activeView === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={tab.description}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="font-medium text-sm">{tab.label}</span>
                <span className="text-xs opacity-75 mt-1">{tab.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Content */}
      <div>
        {activeView === 'managers' && <InstitutionalPortfoliosCarousel userPortfolio={userPortfolio} />}
        {activeView === 'overlap' && <OverlapAnalysis />}
        {activeView === 'conviction' && <ConvictionPicks />}
        {activeView === 'activity' && <RecentActivity />}
        {activeView === 'clone' && <PortfolioCloning />}
      </div>
    </div>
  );
};

export default SmartMoneyHub;
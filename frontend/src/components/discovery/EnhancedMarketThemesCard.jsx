import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  TrendingUp, 
  Shield, 
  Battery, 
  Cpu, 
  DollarSign,
  Globe,
  Heart,
  Building,
  Zap
} from 'lucide-react';

/**
 * 📊 ENHANCED MARKET THEMES CARD - WITH REAL SECTOR DATA
 * 
 * Phase 1 Enhancement: Uses real-time sector performance from FMP
 * Shows actual sector rotation and market themes
 */
const EnhancedMarketThemesCard = ({ data, isSelected, onClick, onStockClick }) => {
  const [sectorData, setSectorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const cardGradient = 'from-purple-500 to-pink-400';
  
  // Fetch real sector performance
  useEffect(() => {
    fetchSectorPerformance();
  }, []);
  
  const fetchSectorPerformance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/enhanced-discovery/sector-performance');
      
      if (response.ok) {
        const result = await response.json();
        setSectorData(result);
      }
    } catch (error) {
      console.error('Failed to fetch sector performance:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get sector icon
  const getSectorIcon = (sector) => {
    const icons = {
      'Technology': <Cpu className="w-4 h-4" />,
      'Financials': <DollarSign className="w-4 h-4" />,
      'Healthcare': <Heart className="w-4 h-4" />,
      'Energy': <Battery className="w-4 h-4" />,
      'Real Estate': <Building className="w-4 h-4" />,
      'Utilities': <Zap className="w-4 h-4" />,
      'Consumer Discretionary': <TrendingUp className="w-4 h-4" />,
      'Consumer Staples': <Shield className="w-4 h-4" />,
      'Industrials': <Globe className="w-4 h-4" />,
      'Materials': <Flame className="w-4 h-4" />,
      'Communication Services': <Globe className="w-4 h-4" />
    };
    return icons[sector] || <TrendingUp className="w-4 h-4" />;
  };
  
  // Get performance color
  const getPerformanceColor = (performance) => {
    if (performance > 2) return 'text-green-300 bg-green-900/50';
    if (performance > 0) return 'text-green-200 bg-green-800/40';
    if (performance > -2) return 'text-yellow-200 bg-yellow-800/40';
    return 'text-red-200 bg-red-800/40';
  };
  
  // Generate dynamic themes based on sector performance
  const generateThemes = () => {
    if (!sectorData?.data) return [];
    
    const themes = [];
    const topSectors = sectorData.data.slice(0, 3);
    const bottomSectors = sectorData.data.slice(-3);
    
    // Risk-On Theme
    if (topSectors.some(s => ['Technology', 'Consumer Discretionary'].includes(s.sector))) {
      themes.push({
        id: 'risk-on',
        title: '🚀 Risk-On Rally',
        description: 'Growth and tech leading the market',
        sectors: topSectors.map(s => s.sector),
        stocks: [] // We'll populate this with top stocks from these sectors
      });
    }
    
    // Defensive Rotation Theme
    if (topSectors.some(s => ['Utilities', 'Consumer Staples', 'Healthcare'].includes(s.sector))) {
      themes.push({
        id: 'defensive',
        title: '🛡️ Defensive Rotation',
        description: 'Safe havens outperforming',
        sectors: topSectors.filter(s => ['Utilities', 'Consumer Staples', 'Healthcare'].includes(s.sector)).map(s => s.sector),
        stocks: []
      });
    }
    
    // Energy Momentum Theme
    if (topSectors.some(s => s.sector === 'Energy')) {
      themes.push({
        id: 'energy',
        title: '⚡ Energy Momentum',
        description: 'Oil and energy stocks surging',
        sectors: ['Energy'],
        stocks: []
      });
    }
    
    // Value Emerging Theme
    const valueSectors = ['Financials', 'Industrials', 'Materials'];
    if (topSectors.some(s => valueSectors.includes(s.sector))) {
      themes.push({
        id: 'value',
        title: '💎 Value Emerging',
        description: 'Traditional value sectors gaining',
        sectors: topSectors.filter(s => valueSectors.includes(s.sector)).map(s => s.sector),
        stocks: []
      });
    }
    
    return themes.slice(0, 3);
  };
  
  const handleStockClick = (symbol, event) => {
    event.stopPropagation();
    console.log(`🔍 Market Themes: User clicked to research ${symbol}`);
    if (onStockClick) {
      onStockClick(symbol);
    }
  };
  
  const themes = generateThemes();
  const marketPhase = sectorData?.marketPhase || 'Loading...';
  const rotationTrend = sectorData?.rotation?.trend || 'Analyzing...';
  
  return (
    <div 
      className={`w-full h-full relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        isSelected ? 'ring-2 ring-white ring-opacity-60 shadow-2xl' : 'shadow-lg hover:shadow-xl'
      }`}
      onClick={onClick}
    >
      <div className={`w-full h-full bg-gradient-to-br ${cardGradient} p-4 text-white relative`}>
        <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <Flame className="w-5 h-5" />
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {marketPhase}
            </span>
          </div>
          
          {/* Title */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-lg font-bold mb-1">Market Themes</h3>
            <p className="text-sm opacity-90 leading-tight">{rotationTrend}</p>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mx-auto mb-2"></div>
                    <div className="text-xs opacity-75">Analyzing sectors...</div>
                  </div>
                </div>
              </div>
            ) : sectorData ? (
              <div className="h-full flex flex-col">
                {/* Leading Sectors */}
                <div className="mb-3">
                  <div className="text-xs opacity-75 mb-1">🔥 Leading Sectors</div>
                  <div className="space-y-1">
                    {sectorData.data?.slice(0, 3).map((sector, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {getSectorIcon(sector.sector)}
                          <span className="truncate">{sector.sector}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded font-medium ${getPerformanceColor(sector.performance.daily)}`}>
                          {sector.performance.daily > 0 ? '+' : ''}{sector.performance.daily.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Active Themes */}
                {themes.length > 0 && (
                  <div className="flex-1">
                    <div className="text-xs opacity-75 mb-1">📈 Active Themes</div>
                    <div className="space-y-2">
                      {themes.map((theme, idx) => (
                        <div key={idx} className="bg-white bg-opacity-10 rounded p-1.5">
                          <div className="text-xs font-semibold mb-0.5">{theme.title}</div>
                          <div className="text-xs opacity-75 mb-1">{theme.description}</div>
                          {theme.stocks && theme.stocks.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {theme.stocks.slice(0, 3).map((stock, i) => (
                                <span 
                                  key={i}
                                  onClick={(e) => handleStockClick(stock.symbol, e)}
                                  className="px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 cursor-pointer transition-colors"
                                >
                                  {stock.symbol}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs opacity-75 mb-1">No theme data</div>
                  <div className="text-xs opacity-60">Try refreshing</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom section */}
          <div className="flex-shrink-0 mt-2">
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
              <div className="truncate">
                {sectorData ? `${sectorData.rotation?.leading?.length || 0} sectors leading` : 'Real-time sector rotation'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMarketThemesCard;

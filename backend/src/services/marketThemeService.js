import eodService from './eodService.js';
import NodeCache from 'node-cache';

// Cache themes for 1 hour
const themesCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });

class MarketThemeService {
  constructor() {
    this.themeIndicators = {
      inflation: ['TIP', 'VTIP', 'SCHP'], // Inflation protected bonds
      riskOn: ['QQQ', 'ARKK', 'ICLN'],    // Growth/Tech ETFs
      riskOff: ['TLT', 'GLD', 'VCSH'],    // Bonds, Gold, Cash
      volatility: ['VXX', 'UVXY', 'VIXY'], // Volatility ETFs
      recovery: ['XLF', 'XLI', 'XLY'],    // Financials, Industrials, Consumer
      defensive: ['XLP', 'XLU', 'XLRE'],  // Staples, Utilities, Real Estate
      energy: ['XLE', 'USO', 'UNG'],      // Energy sector
      tech: ['XLK', 'QQEW', 'IGV']        // Technology sector
    };
  }

  /**
   * Analyze market themes based on sector and indicator performance
   */
  async getMarketThemes() {
    // Check cache first
    const cacheKey = 'market_themes';
    const cachedThemes = themesCache.get(cacheKey);
    if (cachedThemes) {
      console.log('Returning cached market themes');
      return cachedThemes;
    }

    try {
      console.log('Analyzing market themes from real data');
      
      const themes = [];
      
      // Get market indices data
      const marketData = await eodService.getMarketData();
      
      // Get sector performance
      const sectors = await eodService.getSectorPerformance();
      
      // Analyze volatility
      const vixData = await eodService.getSingleStockData('VXX.US').catch(() => null);
      if (vixData && vixData.changePercent > 5) {
        themes.push({
          title: 'Elevated Market Volatility',
          description: `VIX up ${vixData.changePercent.toFixed(2)}% - Markets showing increased volatility and uncertainty`,
          strength: Math.min(Math.abs(vixData.changePercent) / 10, 1),
          type: 'warning'
        });
      }
      
      // Analyze risk sentiment (Tech vs Defensive)
      const techSector = sectors.find(s => s.symbol === 'XLK');
      const utilitiesSector = sectors.find(s => s.symbol === 'XLU');
      
      if (techSector && utilitiesSector) {
        const riskDiff = techSector.changePercent - utilitiesSector.changePercent;
        if (riskDiff > 2) {
          themes.push({
            title: 'Risk-On Sentiment',
            description: `Tech outperforming utilities by ${riskDiff.toFixed(2)}% - Investors showing appetite for growth`,
            strength: Math.min(riskDiff / 5, 1),
            type: 'bullish'
          });
        } else if (riskDiff < -2) {
          themes.push({
            title: 'Defensive Rotation',
            description: `Utilities outperforming tech by ${Math.abs(riskDiff).toFixed(2)}% - Flight to defensive sectors`,
            strength: Math.min(Math.abs(riskDiff) / 5, 1),
            type: 'bearish'
          });
        }
      }
      
      // Analyze market breadth
      const spyData = marketData.find(m => m.symbol === 'SPY');
      const iwmData = marketData.find(m => m.symbol === 'IWM');
      
      if (spyData && iwmData) {
        const breadthDiff = iwmData.changePercent - spyData.changePercent;
        if (breadthDiff > 1) {
          themes.push({
            title: 'Broad Market Participation',
            description: `Small caps outperforming large caps - Healthy market breadth`,
            strength: Math.min(breadthDiff / 3, 1),
            type: 'bullish'
          });
        } else if (breadthDiff < -1) {
          themes.push({
            title: 'Flight to Quality',
            description: `Large caps outperforming small caps - Investors seeking safety`,
            strength: Math.min(Math.abs(breadthDiff) / 3, 1),
            type: 'bearish'
          });
        }
      }
      
      // Analyze inflation expectations
      const tltData = await eodService.getSingleStockData('TLT.US').catch(() => null);
      const tipData = await eodService.getSingleStockData('TIP.US').catch(() => null);
      
      if (tltData && tipData) {
        const inflationDiff = tipData.changePercent - tltData.changePercent;
        if (inflationDiff > 1) {
          themes.push({
            title: 'Rising Inflation Expectations',
            description: `TIPS outperforming treasuries - Market pricing in higher inflation`,
            strength: Math.min(inflationDiff / 3, 1),
            type: 'warning'
          });
        }
      }
      
      // If no strong themes, provide general market theme
      if (themes.length === 0) {
        const overallChange = marketData.reduce((sum, m) => sum + m.changePercent, 0) / marketData.length;
        if (overallChange > 0.5) {
          themes.push({
            title: 'Bullish Market Sentiment',
            description: `Major indices up ${overallChange.toFixed(2)}% on average`,
            strength: Math.min(overallChange / 2, 1),
            type: 'bullish'
          });
        } else if (overallChange < -0.5) {
          themes.push({
            title: 'Bearish Market Pressure',
            description: `Major indices down ${Math.abs(overallChange).toFixed(2)}% on average`,
            strength: Math.min(Math.abs(overallChange) / 2, 1),
            type: 'bearish'
          });
        } else {
          themes.push({
            title: 'Market Consolidation',
            description: 'Markets trading in tight range with mixed signals',
            strength: 0.5,
            type: 'neutral'
          });
        }
      }
      
      // Sort themes by strength and take top 3
      themes.sort((a, b) => b.strength - a.strength);
      const topThemes = themes.slice(0, 3);
      
      // Ensure we have at least one theme
      if (topThemes.length === 0) {
        topThemes.push({
          title: 'Stable Market Conditions',
          description: 'Markets showing normal trading patterns with low volatility',
          strength: 0.5,
          type: 'neutral'
        });
      }
      
      // Cache the results
      themesCache.set(cacheKey, topThemes);
      
      return topThemes;
      
    } catch (error) {
      console.error('Error analyzing market themes:', error);
      
      // Return sensible defaults
      return [{
        title: 'Market Analysis Pending',
        description: 'Analyzing current market conditions',
        strength: 0.5,
        type: 'neutral'
      }];
    }
  }
}

export default new MarketThemeService();

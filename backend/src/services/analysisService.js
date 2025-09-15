import axios from 'axios';

class AnalysisService {
  constructor() {
    this.braveApiKey = 'BSAFHHikdsv2YXSYODQSPES2tTMILHI';
    this.cache = new Map();
    this.cacheDuration = 60000; // 1 minute cache
  }

  async generateMarketAnalysis(marketData, score) {
    try {
      // Core market indicators
      const spy = marketData.find(d => d.symbol.includes('SPY'));
      const qqq = marketData.find(d => d.symbol.includes('QQQ'));
      const dia = marketData.find(d => d.symbol.includes('DIA'));
      
      // Risk metrics
      const tlt = marketData.find(d => d.symbol.includes('TLT'));
      const vwo = marketData.find(d => d.symbol.includes('VWO'));
      const uup = marketData.find(d => d.symbol.includes('UUP'));
      const ibit = marketData.find(d => d.symbol.includes('IBIT'));

      // Sector performance
      const sectors = marketData.filter(d => d.symbol.startsWith('XL'));
      const sectorPerformance = sectors.map(s => ({
        name: this.getSectorName(s.symbol),
        change: s.change_p
      }));

      // Market breadth calculation
      const positiveCount = sectors.filter(s => s.change_p > 0).length;
      const breadth = (positiveCount / sectors.length) * 100;

      // Get latest news
      const news = await this.getMarketNews();

      // Build comprehensive analysis
      let analysis = '';

      // 1. Market Overview
      analysis += this.getMarketOverview(spy, qqq, dia, score);

      // 2. Sector Analysis
      analysis += '\n\nSector Performance: ';
      analysis += this.getSectorAnalysis(sectorPerformance, breadth);

      // 3. Risk Analysis
      analysis += '\n\nRisk Metrics: ';
      analysis += this.getRiskAnalysis(tlt, uup, vwo, ibit);

      // 4. Notable News
      if (news.length > 0) {
        analysis += '\n\nKey Market Developments: ';
        analysis += this.formatNewsHighlights(news);
      }

      // 5. Investment Implications
      analysis += '\n\nInvestment Implications: ';
      analysis += this.getInvestmentImplications(score, breadth, sectorPerformance);

      return analysis;
    } catch (error) {
      console.error('Error generating analysis:', error);
      throw error;
    }
  }

  getMarketOverview(spy, qqq, dia, score) {
    const marketState = score > 66 ? 'bullish' : score > 33 ? 'neutral' : 'cautious';
    let overview = `The market environment is currently showing ${marketState} characteristics. `;

    if (spy && qqq && dia) {
      overview += `The S&P 500 is ${spy.change_p > 0 ? 'up' : 'down'} ${Math.abs(spy.change_p).toFixed(2)}%, `;
      overview += `while the Nasdaq is ${qqq.change_p > 0 ? 'up' : 'down'} ${Math.abs(qqq.change_p).toFixed(2)}% `;
      overview += `and the Dow Jones is ${dia.change_p > 0 ? 'up' : 'down'} ${Math.abs(dia.change_p).toFixed(2)}%. `;
    }

    return overview;
  }

  getSectorAnalysis(sectorPerformance, breadth) {
    const sortedSectors = [...sectorPerformance].sort((a, b) => b.change - a.change);
    const leaders = sortedSectors.slice(0, 2);
    const laggards = sortedSectors.slice(-2);

    let analysis = `Market breadth is ${breadth > 60 ? 'strong' : breadth > 40 ? 'mixed' : 'weak'} `;
    analysis += `with ${Math.round(breadth)}% of sectors showing positive performance. `;
    analysis += `Leading sectors include ${leaders.map(s => s.name).join(' and ')}, `;
    analysis += `while ${laggards.map(s => s.name).join(' and ')} are underperforming. `;

    return analysis;
  }

  getRiskAnalysis(tlt, uup, vwo, ibit) {
    let analysis = '';

    if (tlt) {
      analysis += `Treasury bonds are ${tlt.change_p > 0 ? 'rising' : 'falling'}, suggesting ${
        tlt.change_p > 0 ? 'defensive positioning' : 'risk appetite'
      } in the market. `;
    }

    if (uup) {
      analysis += `The US Dollar is ${uup.change_p > 0 ? 'strengthening' : 'weakening'}, which ${
        uup.change_p > 0 ? 'may pressure' : 'supports'
      } global assets. `;
    }

    if (vwo) {
      analysis += `Emerging markets are ${vwo.change_p > 0 ? 'outperforming' : 'underperforming'}. `;
    }

    if (ibit) {
      analysis += `Bitcoin is ${ibit.change_p > 0 ? 'rallying' : 'declining'}, indicating ${
        ibit.change_p > 0 ? 'increased' : 'decreased'
      } risk appetite in digital assets. `;
    }

    return analysis;
  }

  getInvestmentImplications(score, breadth, sectorPerformance) {
    const marketStrength = score > 66 ? 'strong' : score > 33 ? 'moderate' : 'weak';
    const breadthQuality = breadth > 60 ? 'broad-based' : breadth > 40 ? 'selective' : 'narrow';
    
    let implications = `Given the ${marketStrength} market conditions with ${breadthQuality} participation, `;
    implications += score > 66 
      ? 'investors might consider maintaining growth exposure while being mindful of position sizing and market levels. '
      : score > 33
      ? 'a balanced approach focusing on quality companies and defensive sectors may be appropriate. '
      : 'capital preservation and defensive positioning might be warranted until conditions improve. ';

    // Add sector-specific recommendations
    const strongSectors = sectorPerformance
      .filter(s => s.change > 0)
      .map(s => s.name)
      .slice(0, 2);
    
    if (strongSectors.length > 0) {
      implications += `Consider exposure to strong sectors like ${strongSectors.join(' and ')}.`;
    }

    return implications;
  }

  async getMarketNews() {
    try {
      const response = await axios.get(
        'https://api.search.brave.com/news/search',
        {
          params: {
            q: 'stock market analysis today',
            count: 3,
            freshness: 'day'
          },
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': this.braveApiKey
          }
        }
      );

      return response.data?.results || [];
    } catch (error) {
      console.error('Error fetching market news:', error);
      return [];
    }
  }

  formatNewsHighlights(news) {
    return news
      .slice(0, 2)
      .map(item => item.title.replace(/\.$/, '') + '. ')
      .join('');
  }

  getSectorName(symbol) {
    const sectorMap = {
      'XLF': 'Financials',
      'XLK': 'Technology',
      'XLE': 'Energy',
      'XLV': 'Healthcare',
      'XLI': 'Industrials',
      'XLC': 'Communications',
      'XLY': 'Consumer Discretionary',
      'XLP': 'Consumer Staples',
      'XLRE': 'Real Estate',
      'XLU': 'Utilities'
    };
    return sectorMap[symbol] || symbol;
  }
}

export default new AnalysisService();

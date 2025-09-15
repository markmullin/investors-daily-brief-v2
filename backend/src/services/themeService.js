import NodeCache from 'node-cache';
import fmpService from './fmpService.js';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

class ThemeService {
  constructor() {
    this.themes = [
      {
        id: 'ai-semi',
        title: "AI & Semiconductor Supercycle",
        description: "The AI revolution is driving unprecedented demand for advanced computing power, leading to a semiconductor supercycle.",
        stocks: ['NVDA', 'AMD', 'MRVL', 'ASML']
      },
      {
        id: 'digital-payments',
        title: "Digital Payments Evolution",
        description: "Digital payment adoption continues to accelerate globally, with fintech companies innovating in payments.",
        stocks: ['MA', 'PYPL', 'ADYEY', 'SQ']
      },
      {
        id: 'infrastructure',
        title: "Infrastructure Modernization",
        description: "Major government initiatives and aging infrastructure are driving significant investments in upgrades.",
        stocks: ['CAT', 'VMC', 'PWR', 'AMT']
      },
      {
        id: 'healthcare',
        title: "Healthcare Innovation",
        description: "Breakthrough technologies in biotech, coupled with aging populations, are creating opportunities in medicine.",
        stocks: ['LLY', 'DXCM', 'ISRG', 'VEEV']
      }
    ];
  }

  async getCurrentThemes() {
    const cacheKey = 'current_themes';
    const cachedThemes = cache.get(cacheKey);
    if (cachedThemes) return cachedThemes;

    try {
      // Get detailed stock info for each theme
      const themesWithDetails = await Promise.all(
        this.themes.map(async (theme) => {
          const stockDetails = await this.getStockDetails(theme.stocks);
          
          // Calculate theme strength based on stock performance
          const avgPerformance = stockDetails.reduce((sum, stock) => sum + (stock.change_p || 0), 0) / stockDetails.length;
          
          return {
            ...theme,
            strength: avgPerformance,
            stocks: stockDetails.map(stock => ({
              symbol: stock.symbol,
              name: stock.name || stock.symbol,
              change_p: stock.change_p,
              themeContext: this.getThemeContext(theme.id, stock.symbol)
            }))
          };
        })
      );

      // Sort themes by strength
      const sortedThemes = themesWithDetails.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
      
      cache.set(cacheKey, sortedThemes);
      return sortedThemes;
    } catch (error) {
      console.error('Error fetching theme data:', error);
      throw error;
    }
  }

  async getStockDetails(symbols) {
    try {
      // Use FMP batch quotes for efficiency
      const quotes = await fmpService.getQuoteBatch(symbols);
      
      return quotes.map(quote => ({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        change_p: quote.changesPercentage,
        volume: quote.volume
      }));
    } catch (error) {
      console.error('Error fetching stock details:', error);
      return symbols.map(symbol => ({ symbol }));
    }
  }

  getThemeContext(themeId, symbol) {
    // Detailed context for each stock's role in its theme
    const contextMap = {
      'ai-semi': {
        'NVDA': 'Leading provider of AI GPUs and accelerated computing solutions, central to AI training and inference.',
        'AMD': 'Growing presence in AI chips with MI300 series, challenging NVIDIA in data center.',
        'MRVL': 'Custom AI chip solutions and networking infrastructure critical for AI deployments.',
        'ASML': 'Monopoly in EUV lithography machines essential for advanced chip manufacturing.'
      },
      'digital-payments': {
        'MA': 'Global payments network benefiting from shift to digital transactions.',
        'PYPL': 'Leading digital wallet and payment solutions provider with Venmo growth.',
        'ADYEY': 'Advanced payment processing platform preferred by large enterprise customers.',
        'SQ': 'Innovative fintech ecosystem with Cash App and seller solutions.'
      },
      'infrastructure': {
        'CAT': 'Construction equipment essential for infrastructure projects.',
        'VMC': 'Largest producer of construction aggregates in the US.',
        'PWR': 'Specialized infrastructure solutions for utilities and renewable energy.',
        'AMT': 'Cell tower REIT benefiting from 5G infrastructure buildout.'
      },
      'healthcare': {
        'LLY': 'Leading GLP-1 treatments for diabetes and obesity, expanding pipeline.',
        'DXCM': 'Continuous glucose monitoring systems revolutionizing diabetes care.',
        'ISRG': 'Dominant in robotic surgery with expanding procedure types.',
        'VEEV': 'Cloud solutions specifically designed for life sciences industry.'
      }
    };

    return contextMap[themeId]?.[symbol] || 'Key player in this theme';
  }
}

export default new ThemeService();

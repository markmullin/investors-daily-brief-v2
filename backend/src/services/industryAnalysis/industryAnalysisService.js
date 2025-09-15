// Industry Analysis Service
// Provides industry analysis data for the dashboard

class IndustryAnalysisService {
  constructor() {
    this.cachedData = null;
    this.lastUpdate = null;
    this.updateInterval = 300000; // 5 minutes
  }

  /**
   * Get all industry analysis pairs
   * @returns {Promise<Object>} Industry analysis data
   */
  async getAllPairs() {
    try {
      // Check if we have cached data that's still fresh
      if (this.cachedData && this.lastUpdate && 
          (Date.now() - this.lastUpdate) < this.updateInterval) {
        return this.cachedData;
      }

      // Generate sample industry analysis data
      const industryData = {
        tech_vs_healthcare: {
          pairKey: 'tech_vs_healthcare',
          name: 'Technology vs Healthcare',
          tech: {
            symbol: 'XLK',
            name: 'Technology Select Sector SPDR Fund',
            price: 185.50,
            change: 2.35,
            changePercent: 1.28
          },
          healthcare: {
            symbol: 'XLV',
            name: 'Health Care Select Sector SPDR Fund', 
            price: 142.25,
            change: -0.85,
            changePercent: -0.59
          },
          analysis: {
            trend: 'Technology outperforming healthcare in current market environment',
            score: 0.65,
            recommendation: 'Overweight technology relative to healthcare'
          }
        },
        financial_vs_energy: {
          pairKey: 'financial_vs_energy',
          name: 'Financials vs Energy',
          financials: {
            symbol: 'XLF',
            name: 'Financial Select Sector SPDR Fund',
            price: 38.75,
            change: 0.45,
            changePercent: 1.18
          },
          energy: {
            symbol: 'XLE', 
            name: 'Energy Select Sector SPDR Fund',
            price: 89.20,
            change: -1.25,
            changePercent: -1.38
          },
          analysis: {
            trend: 'Financials showing relative strength vs energy sector',
            score: 0.42,
            recommendation: 'Neutral allocation between sectors'
          }
        },
        consumer_cyclical_vs_staples: {
          pairKey: 'consumer_cyclical_vs_staples',
          name: 'Consumer Cyclical vs Staples',
          cyclical: {
            symbol: 'XLY',
            name: 'Consumer Discretionary Select Sector SPDR Fund',
            price: 182.10,
            change: 1.85,
            changePercent: 1.03
          },
          staples: {
            symbol: 'XLP',
            name: 'Consumer Staples Select Sector SPDR Fund',
            price: 78.95,
            change: -0.25,
            changePercent: -0.32
          },
          analysis: {
            trend: 'Consumer discretionary outpacing staples, indicating risk-on sentiment',
            score: 0.78,
            recommendation: 'Overweight cyclical consumer stocks'
          }
        }
      };

      this.cachedData = industryData;
      this.lastUpdate = Date.now();

      return industryData;

    } catch (error) {
      console.error('Industry analysis service error:', error);
      
      // Return minimal fallback data
      return {
        error: 'Industry analysis temporarily unavailable',
        fallback: {
          pairKey: 'fallback',
          name: 'Service Unavailable',
          analysis: {
            trend: 'Industry analysis service is currently unavailable',
            score: 0.5,
            recommendation: 'Please try again later'
          }
        }
      };
    }
  }

  /**
   * Get specific industry pair analysis
   * @param {string} pairKey - The key of the industry pair
   * @returns {Promise<Object>} Specific pair analysis
   */
  async getPairAnalysis(pairKey) {
    try {
      const allPairs = await this.getAllPairs();
      return allPairs[pairKey] || null;
    } catch (error) {
      console.error(`Error getting pair analysis for ${pairKey}:`, error);
      return null;
    }
  }

  /**
   * Clear cached data (useful for testing)
   */
  clearCache() {
    this.cachedData = null;
    this.lastUpdate = null;
  }
}

// Create singleton instance
const industryAnalysisService = new IndustryAnalysisService();

export { industryAnalysisService };
export default industryAnalysisService;

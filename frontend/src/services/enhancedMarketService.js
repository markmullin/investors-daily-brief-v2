import { fetchWithConfig } from './api';

export const enhancedMarketService = {
  // Get the enhanced market score
  getEnhancedScore: () => 
    fetchWithConfig('/enhanced-market/score'),
  
  // Get detailed timeframe analysis
  getTimeframeAnalysis: () => 
    fetchWithConfig('/enhanced-market/timeframes'),
  
  // Get relationship insights
  getRelationshipInsights: () => 
    fetchWithConfig('/enhanced-market/relationships'),
  
  // Get full market analysis
  getFullAnalysis: () => 
    fetchWithConfig('/enhanced-market/analysis')
};

export default enhancedMarketService;
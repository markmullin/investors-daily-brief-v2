import marketEnvironmentService, { marketRelationships } from '../marketEnvironmentService.js';

export const relationshipAnalysis = {
  enhanceIndustryData(data) {
    try {
      const enhanced = {};
      
      for (const [key, pairData] of Object.entries(data)) {
        const analysis = marketRelationships.analyzeIndustryRelationship(
          key,
          pairData.performance?.trend || { relative: 0 }
        );
        
        enhanced[key] = {
          ...pairData,
          analysis: {
            interpretation: analysis.interpretation || 'Analysis temporarily unavailable',
            scoreImpact: analysis.scoreImpact || 0,
            trend: analysis.trend || 0
          }
        };
      }
      
      return enhanced;
    } catch (error) {
      console.error('Error in enhanceIndustryData:', error);
      return data;  // Return original data if enhancement fails
    }
  },

  enhanceMacroData(data) {
    try {
      const enhanced = {};
      
      for (const [key, groupData] of Object.entries(data)) {
        const analysis = marketRelationships.analyzeMacroRelationship(
          key,
          groupData.performance?.trends || [0]
        );
        
        enhanced[key] = {
          ...groupData,
          analysis: {
            interpretation: analysis.interpretation || 'Analysis temporarily unavailable',
            scoreImpact: analysis.scoreImpact || 0,
            trends: analysis.trends || [0]
          }
        };
      }
      
      return enhanced;
    } catch (error) {
      console.error('Error in enhanceMacroData:', error);
      return data;  // Return original data if enhancement fails
    }
  }
};
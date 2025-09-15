import { marketService } from './apiServices.js';

// backend/src/services/sectorAnalysisService.js
class SectorAnalysisService {
    determineCycleStage(sectorData) {
      // Most basic cycle determination logic (you can make this more sophisticated)
      const tech = sectorData.find(s => s.symbol === 'XLK');
      const healthcare = sectorData.find(s => s.symbol === 'XLV');
      const financials = sectorData.find(s => s.symbol === 'XLF');
      const utilities = sectorData.find(s => s.symbol === 'XLU');
      
      if (tech?.change_p > 0 && financials?.change_p > 0) {
        return {
          stage: 'Early Bull Market',
          insights: [
            'Technology and Financial sectors showing leadership',
            'Consider increasing exposure to growth stocks',
            'Watch for continuation of upward momentum in cyclical sectors'
          ]
        };
      } else if (healthcare?.change_p > 0 && utilities?.change_p > 0) {
        return {
          stage: 'Late Bear Market',
          insights: [
            'Defensive sectors showing strength',
            'Consider maintaining defensive positioning',
            'Watch for signs of market bottom in growth sectors'
          ]
        };
      } else if (tech?.change_p < 0 && financials?.change_p < 0) {
        return {
          stage: 'Early Bear Market',
          insights: [
            'Consider reducing exposure to growth stocks',
            'Rotate into defensive sectors like Healthcare and Utilities',
            'Maintain higher cash position'
          ]
        };
      } else {
        return {
          stage: 'Market Transition',
          insights: [
            'Mixed sector performance suggests market transition',
            'Monitor sector rotation for clear trend emergence',
            'Consider balanced exposure across sectors'
          ]
        };
      }
    }
  
    async getSectorRotationAnalysis() {
      try {
        const sectorData = await marketService.getSectorData();
        const sortedSectors = [...sectorData].sort((a, b) => b.change_p - a.change_p);
        const cycleAnalysis = this.determineCycleStage(sectorData);
        
        return {
          sectors: sortedSectors,
          marketPhase: cycleAnalysis.stage,
          interpretation: {
            phase: `Current market phase: ${cycleAnalysis.stage}. ${sortedSectors[0]?.name} leading while ${sortedSectors[sortedSectors.length - 1]?.name} showing weakness.`,
            actionItems: cycleAnalysis.insights
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error analyzing sector rotation:', error);
        throw error;
      }
    }
  }
  
  export default new SectorAnalysisService();

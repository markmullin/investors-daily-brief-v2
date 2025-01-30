import { marketService } from './apiServices.js';

class SectorAnalysisService {
  async getSectorRotationAnalysis() {
    try {
      const sectorData = await marketService.getSectorData();
      
      // Sort sectors by performance
      const sortedSectors = [...sectorData].sort((a, b) => b.change_p - a.change_p);
      
      // Simple interpretation
      const leaders = sortedSectors.slice(0, 3);
      const laggards = sortedSectors.slice(-3);
      
      const interpretation = 
        `Market leaders: ${leaders.map(s => s.name).join(', ')} showing strength. ` +
        `Underperforming sectors: ${laggards.map(s => s.name).join(', ')}.`;
      
      return {
        sectors: sortedSectors,
        interpretation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing sector rotation:', error);
      throw error;
    }
  }
}

export default new SectorAnalysisService();
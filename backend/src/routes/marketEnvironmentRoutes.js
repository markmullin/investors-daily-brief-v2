import express from 'express';
import marketEnvironmentCollectionAware from '../services/marketEnvironmentCollectionAware.js';

const router = express.Router();

/**
 * GET /api/market-environment/score
 * Get dual market environment scores - uses S&P 500 collection data if available,
 * otherwise falls back to basic market indicators with clear messaging
 */
router.get('/score', async (req, res, next) => {
  try {
    console.log('🎯 Fetching collection-aware dual market scores...');
    
    const dualScores = await marketEnvironmentCollectionAware.calculateDualScores();
    
    // Enhanced response with collection status information
    const response = {
      // Dual scores (main focus)
      shortTerm: dualScores.shortTerm,
      longTerm: dualScores.longTerm,
      
      // Investment guidance
      marketPhase: dualScores.marketPhase,
      investmentGuidance: dualScores.investmentGuidance,
      
      // Combined score for legacy compatibility
      overallScore: Math.round((dualScores.shortTerm.score + dualScores.longTerm.score) / 2),
      grade: dualScores.shortTerm.grade,
      
      // Analysis 
      analysis: {
        basic: `${dualScores.shortTerm.analysis} ${dualScores.longTerm.analysis}`,
        shortTerm: dualScores.shortTerm.analysis,
        longTerm: dualScores.longTerm.analysis,
        guidance: dualScores.investmentGuidance
      },
      
      timestamp: dualScores.timestamp,
      
      // Collection status and data source information
      dataSource: {
        shortTerm: dualScores.shortTerm.dataSource,
        longTerm: dualScores.longTerm.dataSource,
        isCollectionBased: dualScores.shortTerm.dataSource === 'sp500_collection'
      },
      
      // Methodology information
      methodology: {
        shortTerm: dualScores.shortTerm.methodology,
        longTerm: dualScores.longTerm.methodology
      },
      
      // Collection information (if available)
      collectionInfo: dualScores.collectionInfo || null,
      
      source: 'collection_aware_analysis'
    };
    
    // Log result with data source information
    if (response.dataSource.isCollectionBased) {
      console.log(`✅ Collection-based scores - Short: ${dualScores.shortTerm.score}, Long: ${dualScores.longTerm.score} (${dualScores.shortTerm.companiesAnalyzed} companies)`);
    } else {
      console.log(`⚠️ Basic indicator scores - Short: ${dualScores.shortTerm.score}, Long: ${dualScores.longTerm.score} (collection not run)`);
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error calculating collection-aware dual scores:', error);
    next(error);
  }
});

export default router;

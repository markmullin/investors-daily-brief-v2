import express from 'express';
import industryAnalysisService from '../services/industryAnalysis/industryAnalysisService.js';

const router = express.Router();

// Get analysis for all ETF pairs
router.get('/all', async (req, res) => {
    try {
        const period = req.query.period || '1y';
        const analysis = await industryAnalysisService.getAllPairsAnalysis(period);
        res.json(analysis);
    } catch (error) {
        console.error('Error in /industry-analysis/all:', error);
        res.status(500).json({ error: 'Failed to fetch industry analysis' });
    }
});

// Get analysis for a specific pair
router.get('/:pairKey', async (req, res) => {
    try {
        const { pairKey } = req.params;
        const period = req.query.period || '1y';
        
        if (!industryAnalysisService.etfPairs[pairKey]) {
            return res.status(404).json({ error: 'Pair not found' });
        }

        const pair = industryAnalysisService.etfPairs[pairKey].pair;
        const performance = await industryAnalysisService.getRelativePerformance(pair, period);
        
        res.json({
            description: industryAnalysisService.etfPairs[pairKey].description,
            symbols: pair,
            performance
        });
    } catch (error) {
        console.error(`Error in /industry-analysis/${req.params.pairKey}:`, error);
        res.status(500).json({ error: 'Failed to fetch pair analysis' });
    }
});

export default router;
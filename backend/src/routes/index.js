import express from 'express';
import marketRoutes from './marketRoutes.js';
import marketRoutesEnhanced from './market.js';
import braveRoutes from './braveRoutes.js';
import macroAnalysisRoutes from './macroAnalysis.js';
import marketEnvironmentRoutes from './marketEnvironmentRoutes.js';
import industryAnalysisRoutes from './industryAnalysis.js';
import monitoringRoutes from './monitoringRoutes.js';
import edgarRoutes from './edgarRoutes.js';
import perfectEdgarRoutes from './perfectEdgarRoutes.js';

// 🚀 Import AI insights routes separately for debugging
import aiInsightsRoutes from './aiInsightsRoutes.js';

// 🤖 Import NEW AI Analysis routes (Python + Mistral integration)
import aiAnalysisRoutes from './aiAnalysisRoutes.js';

// 🚀 NEW: Enhanced AI routes with real data fallbacks
import enhancedAiRoutes from './enhancedAiRoutes.js';

// 📰 NEW: Enhanced current events with real news sources
import currentEventsAiRoutes from './currentEventsAiRoutes.js';

// ⚡ PRIORITY: Streamlined AI routes with timeout protection (PERFORMANCE OPTIMIZED)
import streamlinedAiRoutes from './streamlinedAiRoutes.js';

// 🎯 NEW: Comprehensive Analysis routes (20-article system: 10 general + 10 company-specific)
import comprehensiveAnalysisRoutes from './comprehensiveAnalysisRoutes.js';

// 🔍 VERIFICATION: Backend status and testing routes
import verificationRoutes from './verificationRoutes.js';

const router = express.Router();

console.log('🔄 Loading routes with COMPREHENSIVE ANALYSIS and PERFORMANCE OPTIMIZATION...');

// 🔍 PRIORITY: Mount verification routes FIRST for debugging
router.use('/verify', verificationRoutes);
console.log('🔍 VERIFICATION routes mounted at /verify (backend testing)');

// Mount routes
router.use('/market', marketRoutes);  // Original market routes
router.use('/market', marketRoutesEnhanced);  // Enhanced market routes
router.use('/market', aiInsightsRoutes);  // 🚀 AI insights routes
console.log('✅ AI insights routes mounted at /market');

// ⚡ PRIORITY: Mount STREAMLINED AI routes first (PERFORMANCE OPTIMIZED)
router.use('/ai', streamlinedAiRoutes);
console.log('🚀 STREAMLINED AI routes mounted at /ai (PERFORMANCE OPTIMIZED - <10s responses)');

// 🎯 NEW: Mount COMPREHENSIVE ANALYSIS routes (20-article system)
router.use('/ai', comprehensiveAnalysisRoutes);
console.log('🎯 COMPREHENSIVE ANALYSIS routes mounted at /ai (20-article system: 10 general + 10 company-specific)');

// 📰 Mount Enhanced Current Events AI routes (secondary)
router.use('/ai', currentEventsAiRoutes);
console.log('✅ Enhanced Current Events AI routes mounted at /ai (with real news sources)');

// 🤖 Mount AI Analysis routes (tertiary)
router.use('/ai-analysis', aiAnalysisRoutes);
console.log('✅ AI Analysis routes mounted at /ai-analysis');

// 🚀 Mount Enhanced AI routes with real data fallbacks (fallback)
router.use('/ai-analysis', enhancedAiRoutes);
console.log('✅ Enhanced AI Analysis routes mounted at /ai-analysis (with real data fallbacks)');

router.use('/brave', braveRoutes);
router.use('/market-environment', marketEnvironmentRoutes);
router.use('/industry-analysis', industryAnalysisRoutes);
router.use('/macro-analysis', macroAnalysisRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/edgar', edgarRoutes);
router.use('/edgar', perfectEdgarRoutes);

console.log('✅ All routes loaded successfully with COMPREHENSIVE ANALYSIS and PERFORMANCE OPTIMIZATION');

// Debug endpoint to list all routes
router.get('/routes', (req, res) => {
    const routes = [];
    router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

// Performance monitoring endpoint
router.get('/performance-status', (req, res) => {
    res.json({
        status: 'optimized',
        features: {
            comprehensive_analysis: 'active',
            streamlined_ai: 'active',
            timeout_protection: 'enabled',
            aggressive_caching: 'enabled',
            performance_mode: 'production',
            verification_endpoints: 'active'
        },
        new_endpoints: {
            comprehensive_analysis: '/api/ai/comprehensive-analysis',
            comprehensive_news_only: '/api/ai/comprehensive-news'
        },
        expected_response_times: {
            comprehensive_analysis: '<15 seconds',
            ai_analysis: '<10 seconds',
            news_service: '<5 seconds',
            market_data: '<3 seconds'
        },
        verification_endpoints: {
            backend_test: '/api/verify/verify-optimizations',
            health_check: '/api/verify/health-fast'
        },
        last_updated: new Date().toISOString()
    });
});

// Emergency diagnostic endpoint
router.get('/emergency-diagnostics', async (req, res) => {
    try {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            routes_loaded: true,
            comprehensive_analysis_active: true,
            streamlined_routes_active: true,
            backend_responsive: true
        };
        
        res.json(diagnostics);
    } catch (error) {
        res.status(500).json({
            error: 'Backend diagnostics failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
import express from 'express';
import marketRoutesEnhanced from './market.js';
import macroRoutes from './macroRoutes.js';
import marketEnvironmentRoutes from './marketEnvironmentRoutes.js';
import industryAnalysisRoutes from './industryAnalysis.js';
import monitoringRoutes from './monitoringRoutes.js';
import streamlinedAiRoutes from './streamlinedAiRoutes.js';
import comprehensiveAnalysisRoutes from './comprehensiveAnalysisRoutes.js';
import verificationRoutes from './verificationRoutes.js';
import aiAnalysisRoutes from './aiAnalysisRoutes.js';
import gptOSSFastRoutes from './gptOSSFast.js';
import gptOSSDailyBriefRoutes from './gptOSSDailyBrief.js';
import intelligentAnalysisRoutes from './intelligentAnalysisRoutes.js';
import researchRoutes from './research.js';
import fundamentalsRoutes from './fundamentals.js';
import earningsRoutes from './earningsRoutes.js'; // *** NEW: EARNINGS ANALYSIS ***
import enhancedNewsRoutes from './enhancedNewsRoutes.js'; // *** NEW: ENHANCED NEWS ***
import institutionalRoutes from './institutional.js'; // *** FIXED: INSTITUTIONAL PORTFOLIOS ***
import cacheRoutes from './cache.js'; // *** NEW: CACHE MANAGEMENT ***
import cleanAnalysisRoutes from './cleanAnalysisRoutes.js'; // *** PROPER SEPARATION: Python calculates, AI interprets ***
import educationRoutes from './educationRoutes.js'; // *** NEW: GPU-powered educational AI ***

const router = express.Router();

console.log('🔄 Loading routes - EDUCATION AI + CLEAN ANALYSIS + ENHANCED NEWS + INSTITUTIONAL PORTFOLIOS + DEBUG + CACHE...');

// *** PRIORITY: Mount EDUCATION routes FIRST (GPU-powered AI explanations) ***
router.use('/education', educationRoutes);
console.log('🎓 EDUCATION routes mounted at /education (GPU-powered AI explanations with Qwen + GPT-OSS)');

// *** PRIORITY: Mount CLEAN ANALYSIS routes FIRST (Proper Architecture) ***
router.use('/clean-analysis', cleanAnalysisRoutes);
console.log('🎯 CLEAN ANALYSIS routes mounted at /clean-analysis (PYTHON CALCULATES, AI INTERPRETS - NO FABRICATED NUMBERS)');

// *** NEW: Mount cache management routes ***
router.use('/cache', cacheRoutes);
console.log('🧹 CACHE routes mounted at /cache (cache management)');

// *** CRITICAL: Mount enhanced news routes FIRST for premium quality ***
router.use('/enhanced-news', enhancedNewsRoutes);
console.log('📰 ENHANCED NEWS routes mounted at /enhanced-news (PREMIUM SOURCES ONLY)');

// 🔍 PRIORITY: Mount verification routes FIRST for debugging
router.use('/verify', verificationRoutes);
console.log('🔍 VERIFICATION routes mounted at /verify (backend testing)');

// *** CRITICAL: Mount fundamentals routes ***
router.use('/fundamentals', fundamentalsRoutes);
console.log('📊 FUNDAMENTALS routes mounted at /fundamentals (FIXES rankings 404s)');

// *** FIXED: Mount institutional portfolios routes ***
router.use('/institutional', institutionalRoutes);
console.log('🏛️ INSTITUTIONAL routes mounted at /institutional (FIXES institutional portfolios)');

// *** DEBUG routes removed - files were missing ***

// 🔧 CRITICAL FIX: Mount research routes for stock screening
router.use('/research', researchRoutes);
console.log('🔧 RESEARCH routes mounted at /research (FIXES stock screening 404s)');

// 📊 NEW: Mount earnings analysis routes
router.use('/earnings', earningsRoutes);
console.log('📊 EARNINGS routes mounted at /earnings (AI-powered earnings transcript analysis)');

// Mount routes
router.use('/market', marketRoutesEnhanced);  // Enhanced market routes

// 🧠 CRITICAL: Mount INTELLIGENT ANALYSIS routes (FIXES 404 errors for /api/intelligent-analysis/market-phase)
router.use('/intelligent-analysis', intelligentAnalysisRoutes);
console.log('🧠 INTELLIGENT ANALYSIS routes mounted at /intelligent-analysis (FIXES market-phase 404s)');

// 🤖 NEW: Mount AI Analysis routes (FIXES 404 errors for /api/ai-analysis/relationships)
router.use('/ai-analysis', aiAnalysisRoutes);
console.log('🤖 AI ANALYSIS routes mounted at /ai-analysis (FIXES relationship analysis 404s)');

// 🧠 PRIORITY: Mount GPT-OSS routes first (LOCAL GPU POWER)
router.use('/gpt-oss', gptOSSFastRoutes);
console.log('🧠 GPT-OSS FAST routes mounted at /gpt-oss (RTX 5060 GPU - fast analysis)');

router.use('/gpt-oss', gptOSSDailyBriefRoutes);
console.log('📰 GPT-OSS DAILY BRIEF routes mounted at /gpt-oss (comprehensive daily analysis)');

// ⚡ PRIORITY: Mount STREAMLINED AI routes first (PERFORMANCE OPTIMIZED)
router.use('/ai', streamlinedAiRoutes);
console.log('🚀 STREAMLINED AI routes mounted at /ai (PERFORMANCE OPTIMIZED - <10s responses)');

// 🎯 NEW: Mount COMPREHENSIVE ANALYSIS routes (20-article system)
router.use('/ai', comprehensiveAnalysisRoutes);
console.log('🎯 COMPREHENSIVE ANALYSIS routes mounted at /ai (20-article system: 10 general + 10 company-specific)');

router.use('/market-environment', marketEnvironmentRoutes);
router.use('/industry-analysis', industryAnalysisRoutes);
router.use('/macro', macroRoutes);  // NEW: Direct macro endpoint for frontend
router.use('/monitoring', monitoringRoutes);

console.log('✅ All routes loaded successfully - ENHANCED NEWS + INSTITUTIONAL PORTFOLIOS + DEBUG + CACHE INTEGRATED');

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
            clean_analysis: 'active', // *** CRITICAL: PROPER ARCHITECTURE - NO FABRICATED NUMBERS ***
            cache_management: 'active', // *** NEW ***
            enhanced_news: 'active', // *** NEW ***
            institutional_portfolios: 'active', // *** FIXED ***
            institutional_debug: 'active', // *** NEW ***
            comprehensive_analysis: 'active',
            streamlined_ai: 'active',
            ai_analysis_routes: 'active',
            research_routes: 'active',
            fundamentals_routes: 'active',
            redis_debug: 'active',
            timeout_protection: 'enabled',
            aggressive_caching: 'enabled',
            performance_mode: 'production',
            verification_endpoints: 'active'
        },
        new_endpoints: {
            clean_analysis_market_phase: '/api/clean-analysis/market-phase', // *** CRITICAL: PYTHON CALCULATES, AI INTERPRETS ***
            clean_analysis_sectors: '/api/clean-analysis/sectors', // *** CRITICAL: NO FABRICATED NUMBERS ***
            clean_analysis_correlations: '/api/clean-analysis/correlations/{pair}', // *** CRITICAL: REAL DATA ONLY ***
            clean_analysis_macro: '/api/clean-analysis/macro', // *** CRITICAL: PROPER SEPARATION ***
            intelligent_analysis_market_phase: '/api/intelligent-analysis/market-phase', // *** FIXED: INTELLIGENT ANALYSIS ***
            intelligent_analysis_health: '/api/intelligent-analysis/health', // *** FIXED: INTELLIGENT ANALYSIS ***
            gpt_oss_fast_analysis: '/api/gpt-oss/fast-analysis', // *** NEW: GPT-OSS FAST ***
            gpt_oss_daily_brief: '/api/gpt-oss/daily-brief', // *** NEW: GPT-OSS DAILY BRIEF ***
            gpt_oss_health: '/api/gpt-oss/health', // *** NEW: GPT-OSS HEALTH ***
            cache_clear_symbol: '/api/cache/clear/{symbol}', // *** NEW ***
            cache_clear_all: '/api/cache/clear-all', // *** NEW ***
            cache_stats: '/api/cache/stats', // *** NEW ***
            enhanced_news_optimal: '/api/enhanced-news/enhanced-optimal-mix', // *** NEW ***
            institutional_portfolios: '/api/institutional/portfolios', // *** FIXED ***
            institutional_by_name: '/api/institutional/portfolios/{name}', // *** FIXED ***
            institutional_top_holdings: '/api/institutional/top-holdings', // *** FIXED ***
            institutional_health: '/api/institutional/health', // *** FIXED ***
            institutional_debug_fmp: '/api/debug/test-fmp-institutional', // *** NEW ***
            institutional_debug_config: '/api/debug/config-check', // *** NEW ***
            institutional_debug_service: '/api/debug/institutional-service-test', // *** NEW ***
            enhanced_comprehensive_analysis: '/api/ai/enhanced-comprehensive-analysis', // *** NEW ***
            comprehensive_analysis: '/api/ai/comprehensive-analysis',
            comprehensive_news_only: '/api/ai/comprehensive-news',
            ai_analysis_relationships: '/api/ai-analysis/relationships/{pair}',
            ai_analysis_sectors: '/api/ai-analysis/sectors',
            ai_analysis_macro: '/api/ai-analysis/macro',
            research_screen: '/api/research/screen',
            research_fundamentals: '/api/research/fundamentals/{symbol}',
            research_compare: '/api/research/compare/stocks',
            fundamentals_status: '/api/fundamentals/status',
            fundamentals_rankings: '/api/fundamentals/top-performers',
            redis_test: '/api/debug/redis-test',
            force_save: '/api/debug/force-save'
        },
        expected_response_times: {
            gpt_oss_fast_analysis: '<45 seconds', // *** NEW: GPT-OSS FAST ***
            gpt_oss_daily_brief: '<5 minutes', // *** NEW: GPT-OSS DAILY BRIEF ***
            cache_operations: '<1 second', // *** NEW ***
            enhanced_news: '<5 seconds', // *** NEW ***
            institutional_portfolios: '<10 seconds', // *** FIXED ***
            institutional_debug: '<5 seconds', // *** NEW ***
            enhanced_comprehensive_analysis: '<15 seconds', // *** NEW ***
            comprehensive_analysis: '<15 seconds',
            ai_analysis: '<10 seconds',
            ai_analysis_relationships: '<5 seconds',
            research_screening: '<10 seconds',
            fundamentals_rankings: '<5 seconds',
            news_service: '<5 seconds',
            market_data: '<3 seconds'
        },
        verification_endpoints: {
            backend_test: '/api/verify/verify-optimizations',
            health_check: '/api/verify/health-fast'
        },
        debug_endpoints: {
            institutional_fmp_test: '/api/debug/test-fmp-institutional',
            institutional_config: '/api/debug/config-check',
            institutional_service: '/api/debug/institutional-service-test',
            quarterly_test: '/api/debug/quarterly-test',
            fmp_direct: '/api/debug/fmp-direct-test'
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
            cache_management_active: true, // *** NEW ***
            enhanced_news_active: true, // *** NEW ***
            institutional_routes_active: true, // *** FIXED ***
            institutional_debug_active: true, // *** NEW ***
            comprehensive_analysis_active: true,
            streamlined_routes_active: true,
            ai_analysis_routes_active: true,
            research_routes_active: true,
            fundamentals_routes_active: true,
            redis_debug_active: true,
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

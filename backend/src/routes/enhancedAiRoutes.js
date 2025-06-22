// Enhanced AI Routes with Real Data Fallbacks - Production Ready
import express from 'express';
import mistralService from '../services/mistralService.js';
import marketAiAnalysisService from '../services/marketAiAnalysisService.js';
import { marketService } from '../services/apiServices.js';

const router = express.Router();

/**
 * GET /api/ai-analysis/sectors
 * Enhanced AI analysis for sector performance with real market data fallbacks
 */
router.get('/sectors', async (req, res) => {
  try {
    console.log('🤖 Starting REAL AI sector analysis...');
    
    // Try Python-based AI analysis first
    let sectorAnalysis = null;
    try {
      sectorAnalysis = await marketAiAnalysisService.generateSectorRotationAnalysis();
      
      // If Python analysis succeeded, return it
      if (sectorAnalysis && !sectorAnalysis.error && sectorAnalysis.generated) {
        console.log('✅ Python AI sector analysis successful');
        return res.json({
          status: 'success',
          analysis: sectorAnalysis.analysis,
          marketCycle: sectorAnalysis.market_cycle,
          leadingSectors: sectorAnalysis.leading_sectors || [],
          laggingSectors: sectorAnalysis.lagging_sectors || [],
          insights: sectorAnalysis.actionable_insights || [],
          rotationStrength: sectorAnalysis.rotation_strength,
          source: sectorAnalysis.source,
          generatedAt: sectorAnalysis.timestamp,
          type: 'sector_analysis',
          dataSource: 'python_ai_service'
        });
      }
    } catch (pythonError) {
      console.warn('Python AI service failed, using enhanced real data analysis:', pythonError.message);
    }
    
    // Enhanced fallback using REAL market data
    console.log('🔄 Using enhanced real data sector analysis...');
    
    // Get real sector data
    const sectorData = await marketService.getSectorData();
    const marketData = await marketService.getMarketData();
    
    if (!sectorData || !Array.isArray(sectorData)) {
      throw new Error('Failed to fetch real sector data');
    }
    
    // Process real sector performance
    const sectorPerformance = sectorData.map(sector => ({
      name: sector.name || sector.symbol,
      symbol: sector.symbol,
      performance: sector.change_p || sector.changePercent || 0,
      price: sector.close || sector.price || 0,
      volume: sector.volume || 0
    })).filter(sector => sector.performance !== undefined);
    
    // Sort by performance
    sectorPerformance.sort((a, b) => b.performance - a.performance);
    
    // Identify leaders and laggards based on REAL data
    const topPerformers = sectorPerformance.slice(0, Math.ceil(sectorPerformance.length * 0.3));
    const bottomPerformers = sectorPerformance.slice(-Math.ceil(sectorPerformance.length * 0.3));
    
    const leadingSectors = topPerformers.map(s => s.name);
    const laggingSectors = bottomPerformers.map(s => s.name);
    
    // Calculate market cycle based on real performance
    const avgPerformance = sectorPerformance.reduce((sum, s) => sum + s.performance, 0) / sectorPerformance.length;
    const positiveCount = sectorPerformance.filter(s => s.performance > 0).length;
    const breadthPercentage = (positiveCount / sectorPerformance.length) * 100;
    
    let marketCycle = 'Mixed Conditions';
    if (avgPerformance > 1 && breadthPercentage > 70) {
      marketCycle = 'Bull Market';
    } else if (avgPerformance > 0 && breadthPercentage > 50) {
      marketCycle = 'Early Bull Market';  
    } else if (avgPerformance < -1 && breadthPercentage < 30) {
      marketCycle = 'Bear Market';
    } else if (avgPerformance < 0 && breadthPercentage < 50) {
      marketCycle = 'Late Bull Market';
    }
    
    // Generate analysis using real data
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    let analysis = `Sector Analysis for ${currentDate}\n\n`;
    
    analysis += `Market Environment: Current sector performance shows ${avgPerformance >= 0 ? 'positive' : 'negative'} average returns of ${avgPerformance.toFixed(2)}%, with ${breadthPercentage.toFixed(1)}% of sectors advancing. This pattern is consistent with ${marketCycle.toLowerCase()} conditions.\n\n`;
    
    analysis += `Leadership Analysis: Leading sectors include ${leadingSectors.slice(0, 3).join(', ')}, with ${topPerformers[0]?.name} showing the strongest performance at ${topPerformers[0]?.performance.toFixed(2)}%. `;
    
    if (leadingSectors.includes('Technology') || leadingSectors.includes('Communication Services')) {
      analysis += `Technology leadership suggests growth-oriented investor sentiment and confidence in innovation themes. `;
    }
    if (leadingSectors.includes('Financials')) {
      analysis += `Financial sector strength typically indicates expectations for rising interest rates and economic expansion. `;
    }
    if (leadingSectors.includes('Energy') || leadingSectors.includes('Materials')) {
      analysis += `Commodity sector leadership often reflects inflationary pressures or supply/demand imbalances. `;
    }
    if (leadingSectors.includes('Healthcare') || leadingSectors.includes('Consumer Staples') || leadingSectors.includes('Utilities')) {
      analysis += `Defensive sector leadership may signal concerns about economic growth or market volatility. `;
    }
    
    analysis += `\n\nSector Rotation Insights: `;
    
    if (marketCycle === 'Bull Market') {
      analysis += `The broad-based sector strength suggests investors are confident about economic prospects. Growth sectors should continue to benefit from risk-on sentiment, while cyclical sectors may see continued inflows. This environment typically favors momentum strategies and growth-oriented positioning.`;
    } else if (marketCycle === 'Early Bull Market') {
      analysis += `The emerging sector strength indicates a potential market recovery phase. Cyclical sectors may begin to outperform as economic optimism builds. This transitional period often rewards early positioning in economically sensitive sectors while maintaining some defensive exposure.`;
    } else if (marketCycle === 'Bear Market') {
      analysis += `The widespread sector weakness reflects defensive investor positioning and economic concerns. Quality factors and dividend-paying sectors typically outperform during these periods. Defensive positioning with focus on stability and income generation is appropriate.`;
    } else if (marketCycle === 'Late Bull Market') {
      analysis += `The mixed sector performance suggests market maturity and potential transition. Leadership may be narrowing, which often precedes broader market weakness. Selective positioning with emphasis on quality and valuation becomes increasingly important.`;
    } else {
      analysis += `The mixed sector signals suggest an uncertain market environment without clear directional bias. This condition often calls for balanced positioning across both growth and defensive sectors while maintaining flexibility for changing conditions.`;
    }
    
    analysis += `\n\nCurrent Market Breadth: With ${breadthPercentage.toFixed(1)}% of sectors showing positive performance, `;
    if (breadthPercentage > 70) {
      analysis += `market breadth is strong and supportive of continued upward momentum. Broad participation reduces single-sector concentration risk and suggests healthy underlying conditions.`;
    } else if (breadthPercentage > 50) {
      analysis += `market breadth is moderate but positive. While not uniformly strong, the majority participation suggests underlying stability with room for improvement.`;
    } else if (breadthPercentage > 30) {
      analysis += `market breadth is concerning, with narrow leadership that may not be sustainable. This pattern often precedes broader market weakness and suggests increased selectivity is warranted.`;
    } else {
      analysis += `market breadth is weak, indicating broad-based selling pressure. This environment typically requires defensive positioning and capital preservation strategies.`;
    }
    
    // Generate insights
    const insights = [];
    
    if (avgPerformance > 1) {
      insights.push('Strong average sector performance supports risk-on positioning');
    } else if (avgPerformance < -1) {
      insights.push('Weak sector performance suggests defensive positioning is appropriate');
    }
    
    if (breadthPercentage > 70) {
      insights.push('Broad market participation supports diversified equity exposure');
    } else if (breadthPercentage < 30) {
      insights.push('Narrow market participation suggests increased selectivity and risk management');
    }
    
    if (leadingSectors.includes('Technology') && leadingSectors.includes('Consumer Discretionary')) {
      insights.push('Growth sector leadership indicates investor confidence in economic expansion');
    }
    
    if (laggingSectors.includes('Utilities') && laggingSectors.includes('Consumer Staples')) {
      insights.push('Defensive sector weakness suggests investors are accepting higher risk for potential returns');
    } else if (leadingSectors.includes('Utilities') || leadingSectors.includes('Consumer Staples')) {
      insights.push('Defensive sector strength suggests investors are prioritizing stability over growth');
    }
    
    insights.push(`Monitor ${topPerformers[0]?.name} for continued leadership and ${bottomPerformers[0]?.name} for potential reversal signals`);
    
    // Success response with real data
    const response = {
      status: 'success',
      analysis,
      marketCycle,
      leadingSectors,
      laggingSectors,
      insights,
      rotationStrength: Math.abs(avgPerformance),
      confidence: breadthPercentage / 100,
      source: 'enhanced-real-data',
      generatedAt: new Date().toISOString(),
      type: 'sector_analysis',
      dataSource: 'real_market_data',
      marketMetrics: {
        averagePerformance: avgPerformance,
        breadthPercentage,
        positiveCount,
        totalSectors: sectorPerformance.length
      }
    };
    
    console.log('✅ Enhanced real data sector analysis completed');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in sector analysis:', error);
    res.status(500).json({
      error: 'Failed to generate sector analysis',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-analysis/macro
 * Enhanced AI analysis for macroeconomic data with real market data fallbacks
 */
router.get('/macro', async (req, res) => {
  try {
    console.log('🤖 Starting REAL AI macro analysis...');
    
    // Try Python-based AI analysis first
    let macroAnalysis = null;
    try {
      macroAnalysis = await marketAiAnalysisService.generateMacroAnalysis();
      
      // If Python analysis succeeded, return it
      if (macroAnalysis && !macroAnalysis.error && macroAnalysis.generated) {
        console.log('✅ Python AI macro analysis successful');
        return res.json({
          status: 'success',
          analysis: macroAnalysis.analysis,
          riskLevel: macroAnalysis.risk_level,
          marketRegime: macroAnalysis.market_regime,
          riskSignals: macroAnalysis.risk_signals || [],
          insights: macroAnalysis.actionable_insights || [],
          regimeConfidence: macroAnalysis.regime_confidence,
          source: macroAnalysis.source,
          generatedAt: macroAnalysis.timestamp,
          type: 'macro_analysis',
          dataSource: 'python_ai_service'
        });
      }
    } catch (pythonError) {
      console.warn('Python AI service failed, using enhanced real data analysis:', pythonError.message);
    }
    
    // Enhanced fallback using REAL market data
    console.log('🔄 Using enhanced real data macro analysis...');
    
    // Get real market data for macro analysis
    const [spyData, tltData, goldData, usdData] = await Promise.all([
      marketService.getHistoricalData('SPY').catch(() => null),
      marketService.getHistoricalData('TLT').catch(() => null), 
      marketService.getHistoricalData('GLD').catch(() => null),
      marketService.getHistoricalData('UUP').catch(() => null)
    ]);
    
    // Calculate recent performance for key assets
    const getRecentPerformance = (data, days = 30) => {
      if (!data || data.length < days) return 0;
      const recent = data[data.length - 1]?.close || data[data.length - 1]?.price || 0;
      const previous = data[data.length - days]?.close || data[data.length - days]?.price || recent;
      return ((recent - previous) / previous) * 100;
    };
    
    const spyPerf = getRecentPerformance(spyData, 30);
    const tltPerf = getRecentPerformance(tltData, 30);
    const goldPerf = getRecentPerformance(goldData, 30);
    const usdPerf = getRecentPerformance(usdData, 30);
    
    // Calculate risk level based on real market conditions
    let riskLevel = 5; // Default moderate
    const riskSignals = [];
    
    // Stocks vs Bonds analysis
    const stockBondSpread = spyPerf - tltPerf;
    if (stockBondSpread > 5) {
      riskLevel = Math.min(riskLevel + 1, 10);
      riskSignals.push('Strong risk-on sentiment (stocks outperforming bonds)');
    } else if (stockBondSpread < -5) {
      riskLevel = Math.max(riskLevel - 2, 1);
      riskSignals.push('Flight to safety (bonds outperforming stocks)');
    }
    
    // Volatility proxy (simplified)
    if (spyData && spyData.length > 10) {
      const recentVolatility = calculateVolatility(spyData.slice(-10));
      if (recentVolatility > 25) {
        riskLevel = Math.max(riskLevel - 1, 1);
        riskSignals.push('Elevated market volatility');
      } else if (recentVolatility < 15) {
        riskLevel = Math.min(riskLevel + 1, 10);
        riskSignals.push('Low volatility environment');
      }
    }
    
    // Gold analysis
    if (goldPerf > 3) {
      riskSignals.push('Gold strength indicates safe-haven demand');
      riskLevel = Math.max(riskLevel - 1, 1);
    } else if (goldPerf < -3) {
      riskSignals.push('Gold weakness suggests risk appetite');
      riskLevel = Math.min(riskLevel + 1, 10);
    }
    
    // USD analysis
    if (usdPerf > 2) {
      riskSignals.push('Dollar strength may pressure risk assets');
    } else if (usdPerf < -2) {
      riskSignals.push('Dollar weakness supports risk assets');
    }
    
    // Determine market regime
    let marketRegime = 'Mixed Conditions';
    if (stockBondSpread > 3 && spyPerf > 2) {
      marketRegime = 'Risk-On';
    } else if (stockBondSpread < -3 && tltPerf > spyPerf) {
      marketRegime = 'Risk-Off';
    } else if (goldPerf > 5 && usdPerf > 3) {
      marketRegime = 'Safe Haven Demand';
    } else if (spyPerf > 5 && riskLevel > 6) {
      marketRegime = 'Bull Market';
    } else if (spyPerf < -5 && riskLevel < 4) {
      marketRegime = 'Bear Market';
    }
    
    // Generate analysis using real data
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    let analysis = `Macroeconomic Analysis for ${currentDate}\n\n`;
    
    analysis += `Market Regime Assessment: Current market conditions indicate a ${marketRegime.toLowerCase()} environment with a risk level of ${riskLevel}/10. `;
    
    switch (marketRegime) {
      case 'Risk-On':
        analysis += `This regime is characterized by investor confidence, with stocks outperforming bonds by ${stockBondSpread.toFixed(1)}% over the past month. Economic optimism is driving asset allocation toward growth-oriented investments.`;
        break;
      case 'Risk-Off':
        analysis += `This defensive regime shows investors fleeing to safety, with bonds outperforming stocks. The ${Math.abs(stockBondSpread).toFixed(1)}% outperformance of bonds reflects economic uncertainty and risk aversion.`;
        break;
      case 'Safe Haven Demand':
        analysis += `Both gold and dollar strength indicate global uncertainty and safe-haven demand. This environment often reflects geopolitical tensions, economic instability, or market stress.`;
        break;
      case 'Bull Market':
        analysis += `Strong equity performance of ${spyPerf.toFixed(1)}% indicates investor confidence and economic optimism. This environment typically supports continued equity exposure and growth-oriented positioning.`;
        break;
      case 'Bear Market':
        analysis += `Weak equity performance of ${spyPerf.toFixed(1)}% reflects bearish sentiment and economic concerns. Defensive positioning and capital preservation become priorities.`;
        break;
      default:
        analysis += `Mixed signals across asset classes suggest an uncertain or transitional market environment without clear directional bias.`;
    }
    
    analysis += `\n\nCross-Asset Analysis: `;
    analysis += `Over the past 30 days, stocks (SPY) have ${spyPerf >= 0 ? 'gained' : 'lost'} ${Math.abs(spyPerf).toFixed(1)}%, while bonds (TLT) have ${tltPerf >= 0 ? 'gained' : 'lost'} ${Math.abs(tltPerf).toFixed(1)}%. `;
    analysis += `Gold has ${goldPerf >= 0 ? 'risen' : 'fallen'} ${Math.abs(goldPerf).toFixed(1)}% and the US Dollar has ${usdPerf >= 0 ? 'strengthened' : 'weakened'} by ${Math.abs(usdPerf).toFixed(1)}%. `;
    
    if (stockBondSpread > 0) {
      analysis += `The ${stockBondSpread.toFixed(1)}% stock outperformance suggests investors are favoring risk assets over safe havens, indicating growth expectations and risk appetite.`;
    } else {
      analysis += `The ${Math.abs(stockBondSpread).toFixed(1)}% bond outperformance indicates flight-to-quality flows and defensive positioning by investors.`;
    }
    
    analysis += `\n\nRisk Assessment: `;
    if (riskLevel >= 7) {
      analysis += `The elevated risk level suggests favorable conditions for growth-oriented investments, though complacency risks should be monitored. Strong momentum and positive sentiment may be creating conditions for potential corrections if expectations become too optimistic.`;
    } else if (riskLevel <= 3) {
      analysis += `The low risk environment reflects defensive investor positioning and economic uncertainty. While this creates potential opportunities for long-term investors, near-term volatility and further downside risks cannot be ruled out.`;
    } else {
      analysis += `The moderate risk level suggests a balanced approach is appropriate, with neither excessive optimism nor pessimism warranted. This environment typically rewards selective positioning and active risk management.`;
    }
    
    analysis += `\n\nInvestment Implications: `;
    
    if (marketRegime === 'Risk-On' || marketRegime === 'Bull Market') {
      analysis += `The current environment supports equity exposure with potential emphasis on growth sectors and cyclical industries. International diversification may provide additional opportunities, while fixed income duration should be managed carefully given potential yield pressures. Alternative investments in real assets or commodities may also benefit from reflation themes.`;
    } else if (marketRegime === 'Risk-Off' || marketRegime === 'Bear Market') {
      analysis += `Defensive positioning is warranted with emphasis on quality bonds, dividend-paying equities, and defensive sectors. Cash positions may be appropriate for tactical opportunities, while commodity exposure should be evaluated carefully. Portfolio volatility reduction becomes a priority over return maximization.`;
    } else if (marketRegime === 'Safe Haven Demand') {
      analysis += `This environment calls for defensive positioning with emphasis on high-quality assets and liquidity. Gold and other precious metals may provide portfolio insurance, while currency effects should be monitored carefully. Geopolitical risk management becomes important for globally exposed investments.`;
    } else {
      analysis += `The mixed environment suggests balanced positioning across asset classes and factors. Maintaining flexibility for changing conditions while avoiding concentration risks is appropriate. Both offensive and defensive elements should be represented in portfolios.`;
    }
    
    // Generate actionable insights
    const insights = [];
    
    if (riskSignals.length > 0) {
      insights.push(`Current risk signals: ${riskSignals.join(', ')}`);
    }
    
    if (Math.abs(stockBondSpread) > 5) {
      insights.push(`Strong ${stockBondSpread > 0 ? 'risk-on' : 'risk-off'} signal from stocks vs bonds relationship`);
    }
    
    if (goldPerf > 5) {
      insights.push('Gold strength suggests portfolio insurance value in precious metals');
    } else if (goldPerf < -5) {
      insights.push('Gold weakness indicates reduced safe-haven demand');
    }
    
    if (riskLevel >= 7) {
      insights.push('Favorable risk environment supports growth-oriented positioning');
    } else if (riskLevel <= 3) {
      insights.push('Elevated risk conditions warrant defensive positioning');
    }
    
    insights.push(`Monitor ${marketRegime.toLowerCase()} regime stability for potential transitions`);
    
    // Success response with real data
    const response = {
      status: 'success',
      analysis,
      riskLevel,
      marketRegime,
      riskSignals,
      insights,
      regimeConfidence: Math.min(Math.abs(stockBondSpread) / 10, 1),
      source: 'enhanced-real-data',
      generatedAt: new Date().toISOString(),
      type: 'macro_analysis',
      dataSource: 'real_market_data',
      marketMetrics: {
        spyPerformance: spyPerf,
        tltPerformance: tltPerf,
        goldPerformance: goldPerf,
        usdPerformance: usdPerf,
        stockBondSpread
      }
    };
    
    console.log('✅ Enhanced real data macro analysis completed');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in macro analysis:', error);
    res.status(500).json({
      error: 'Failed to generate macro analysis',
      details: error.message
    });
  }
});

/**
 * Helper function to calculate volatility
 */
function calculateVolatility(data) {
  if (!data || data.length < 2) return 0;
  
  const prices = data.map(d => d.close || d.price || 0);
  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1] > 0) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
  }
  
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
}

export default router;
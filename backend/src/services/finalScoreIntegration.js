import realtimeMonitorService from './realtimeMonitorService.js';
import enhancedMarketScore from './enhancedMarketScore.js';
import marketEnvironmentService from './marketEnvironmentService.js';
import relationshipScoring from './relationshipScoring.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const finalScoreIntegration = {
  async calculateFinalScore() {
    try {
      // Get all scoring components
      const [baseScore, monitorData, marketRelationships] = await Promise.all([
        enhancedMarketScore.calculateEnhancedScore(),
        realtimeMonitorService.getRealtimeInsights(),
        marketEnvironmentService.analyzeMarketRelationships()
      ]);

      // Calculate relationship scores
      const relationshipScores = relationshipScoring.calculateRelationshipScores(marketRelationships);

      // Calculate trend impacts
      const trendImpacts = await this.calculateTrendImpacts();
      
      // Apply monitoring adjustments
      const monitoringAdjustments = this.calculateMonitoringAdjustments(monitorData);
      
      // Calculate final score with all components including relationships
      const finalScore = this.integrateScores(baseScore, trendImpacts, monitoringAdjustments, relationshipScores);

      return {
        score: finalScore.score,
        components: finalScore.components,
        analysis: finalScore.analysis,
        trends: trendImpacts,
        monitoring: monitoringAdjustments,
        relationships: relationshipScores,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error calculating final score:', error);
      throw error;
    }
  },

  async calculateTrendImpacts() {
    const recentRegimes = await marketMonitorService.monitorRegimeChanges();
    const impacts = {
      shortTerm: this.assessShortTermTrends(recentRegimes),
      mediumTerm: this.assessMediumTermTrends(recentRegimes),
      longTerm: this.assessLongTermTrends(recentRegimes)
    };

    return {
      ...impacts,
      netImpact: this.calculateNetTrendImpact(impacts)
    };
  },

  assessShortTermTrends(regimeData) {
    const shortTermFactors = {
      momentum: 0,
      volatility: 0,
      breadth: 0
    };

    if (regimeData.current?.[50]) {
      const regime = regimeData.current[50];
      
      // Momentum assessment
      if (regime.momentumRegime === 'Strong') shortTermFactors.momentum = 2;
      else if (regime.momentumRegime === 'Weak') shortTermFactors.momentum = -2;
      
      // Volatility assessment
      if (regime.volatilityRegime === 'Low') shortTermFactors.volatility = 1;
      else if (regime.volatilityRegime === 'High') shortTermFactors.volatility = -1;
      
      // Breadth assessment
      shortTermFactors.breadth = this.assessMarketBreadth(regime);
    }

    return {
      factors: shortTermFactors,
      impact: Object.values(shortTermFactors).reduce((a, b) => a + b, 0)
    };
  },

  assessMediumTermTrends(regimeData) {
    const mediumTermFactors = {
      trend: 0,
      riskRegime: 0,
      correlation: 0
    };

    if (regimeData.current?.[100]) {
      const regime = regimeData.current[100];
      
      // Trend assessment
      mediumTermFactors.trend = this.assessTrendStrength(regime);
      
      // Risk regime assessment
      if (regime.riskRegime === 'Risk-On') mediumTermFactors.riskRegime = 2;
      else if (regime.riskRegime === 'Risk-Off') mediumTermFactors.riskRegime = -2;
      
      // Correlation assessment
      mediumTermFactors.correlation = this.assessCorrelationRegime(regime);
    }

    return {
      factors: mediumTermFactors,
      impact: Object.values(mediumTermFactors).reduce((a, b) => a + b, 0)
    };
  },

  assessLongTermTrends(regimeData) {
    const longTermFactors = {
      structural: 0,
      cycle: 0,
      regime: 0
    };

    if (regimeData.current?.[200]) {
      const regime = regimeData.current[200];
      
      // Structural trend assessment
      longTermFactors.structural = this.assessStructuralTrend(regime);
      
      // Market cycle assessment
      longTermFactors.cycle = this.assessMarketCycle(regime);
      
      // Long-term regime assessment
      longTermFactors.regime = this.assessLongTermRegime(regime);
    }

    return {
      factors: longTermFactors,
      impact: Object.values(longTermFactors).reduce((a, b) => a + b, 0)
    };
  },

  calculateMonitoringAdjustments(monitorData) {
    if (!monitorData || monitorData.status !== 'active') {
      return { total: 0, components: {} };
    }

    const adjustments = {
      regimes: this.calculateRegimeAdjustment(monitorData.monitoring.regimes),
      correlations: this.calculateCorrelationAdjustment(monitorData.monitoring.correlations),
      risks: this.calculateRiskAdjustment(monitorData.monitoring.risks)
    };

    return {
      components: adjustments,
      total: Object.values(adjustments).reduce((a, b) => a + b, 0)
    };
  },

  calculateRegimeAdjustment(regimes) {
    if (!regimes?.current) return 0;
    
    let adjustment = 0;
    
    // Regime state impact
    if (regimes.current.riskRegime === 'Risk-On') adjustment += 2;
    else if (regimes.current.riskRegime === 'Risk-Off') adjustment -= 2;
    
    // Volatility impact
    if (regimes.current.volatilityRegime === 'Low') adjustment += 1;
    else if (regimes.current.volatilityRegime === 'High') adjustment -= 1;
    
    // Momentum impact
    if (regimes.current.momentumRegime === 'Strong') adjustment += 1;
    else if (regimes.current.momentumRegime === 'Weak') adjustment -= 1;

    return adjustment;
  },

  calculateCorrelationAdjustment(correlations) {
    if (!correlations) return 0;
    
    let adjustment = 0;
    
    // Correlation breakdown impact
    if (correlations.breakdowns) {
      adjustment -= correlations.breakdowns.length * 0.5;
    }
    
    // Significant changes impact
    if (correlations.significantChanges > 0) {
      adjustment -= correlations.significantChanges;
    }

    return adjustment;
  },

  calculateRiskAdjustment(risks) {
    if (!risks) return 0;
    
    const riskLevels = {
      'Low': 2,
      'Moderate': 0,
      'Elevated': -2,
      'High': -4
    };

    let adjustment = riskLevels[risks.level] || 0;
    
    // Add impact of recent changes
    if (risks.changes?.level?.changed) {
      adjustment += risks.changes.level.to === 'Low' ? 1 :
                   risks.changes.level.to === 'High' ? -1 : 0;
    }

    return adjustment;
  },

  calculateNetTrendImpact(impacts) {
    // Weight the different timeframes
    const weightedImpact = 
      (impacts.shortTerm.impact * 0.2) +    // 20% weight to short-term
      (impacts.mediumTerm.impact * 0.3) +   // 30% weight to medium-term
      (impacts.longTerm.impact * 0.5);      // 50% weight to long-term

    return weightedImpact;
  },

  integrateScores(baseScore, trendImpacts, monitoringAdjustments, relationshipScores) {
    // Calculate weighted components
    const components = {
      base: baseScore.score * 0.45,                    // 45% base score
      trends: trendImpacts.netImpact * 0.20,          // 20% trend impacts
      monitoring: monitoringAdjustments.total * 0.15,  // 15% monitoring adjustments
      relationships: relationshipScores.composite.score * 0.20  // 20% relationship insights
    };

    // Calculate final score
    const rawScore = Object.values(components).reduce((a, b) => a + b, 0);
    const finalScore = Math.min(100, Math.max(0, rawScore));

    return {
      score: finalScore,
      components,
      analysis: this.generateFinalAnalysis({
        finalScore,
        components,
        trendImpacts,
        monitoringAdjustments,
        baseScore,
        relationshipScores
      })
    };
  },

  generateFinalAnalysis(data) {
    const { finalScore, components, trendImpacts, monitoringAdjustments, baseScore, relationshipScores } = data;

    return {
      summary: this.generateSummary(finalScore, components),
      components: this.analyzeComponents(components),
      trends: this.analyzeTrends(trendImpacts),
      monitoring: this.analyzeMonitoring(monitoringAdjustments),
      relationships: this.analyzeRelationships(relationshipScores),
      implications: this.generateImplications(finalScore, baseScore)
    };
  },

  generateSummary(finalScore, components) {
    const direction = finalScore > components.base ? 'improving' : 'deteriorating';
    const magnitude = Math.abs(finalScore - components.base) > 5 ? 'significantly' : 'slightly';

    return `Market conditions are ${magnitude} ${direction} from baseline. ` +
           `Current score of ${finalScore.toFixed(1)} reflects ${
             this.interpretScoreLevel(finalScore)
           }.`;
  },

  interpretScoreLevel(score) {
    if (score >= 80) return 'strongly favorable conditions';
    if (score >= 65) return 'moderately favorable conditions';
    if (score >= 45) return 'neutral conditions';
    if (score >= 30) return 'challenging conditions';
    return 'highly challenging conditions';
  },

  analyzeComponents(components) {
    return {
      base: {
        contribution: components.base.toFixed(1),
        interpretation: this.interpretBaseScore(components.base)
      },
      trends: {
        contribution: components.trends.toFixed(1),
        interpretation: this.interpretTrendContribution(components.trends)
      },
      monitoring: {
        contribution: components.monitoring.toFixed(1),
        interpretation: this.interpretMonitoringContribution(components.monitoring)
      },
      relationships: {
        contribution: components.relationships.toFixed(1),
        interpretation: this.interpretRelationshipContribution(components.relationships)
      }
    };
  },

  interpretBaseScore(score) {
    if (score >= 48) return 'Core market conditions are supportive';
    if (score >= 36) return 'Core market conditions are stable';
    return 'Core market conditions present challenges';
  },

  interpretTrendContribution(contribution) {
    if (contribution > 2) return 'Trends are providing significant support';
    if (contribution < -2) return 'Trends are creating notable headwinds';
    return 'Trends are having neutral impact';
  },

  interpretMonitoringContribution(contribution) {
    if (contribution > 1) return 'Real-time conditions are supportive';
    if (contribution < -1) return 'Real-time conditions are challenging';
    return 'Real-time conditions are stable';
  },

  interpretRelationshipContribution(contribution) {
    if (contribution > 2) return 'Market relationships are providing strong support';
    if (contribution > 0) return 'Market relationships are modestly supportive';
    if (contribution < -2) return 'Market relationships indicate significant stress';
    if (contribution < 0) return 'Market relationships show modest stress';
    return 'Market relationships are neutral';
  },

  analyzeTrends(trendImpacts) {
    return {
      shortTerm: this.interpreTrendTimeframe(trendImpacts.shortTerm, 'short'),
      mediumTerm: this.interpreTrendTimeframe(trendImpacts.mediumTerm, 'medium'),
      longTerm: this.interpreTrendTimeframe(trendImpacts.longTerm, 'long'),
      netImpact: this.interpretNetTrendImpact(trendImpacts.netImpact)
    };
  },

  interpreTrendTimeframe(timeframe, period) {
    const impact = timeframe.impact;
    const type = period === 'short' ? 'tactical' :
                 period === 'medium' ? 'intermediate' : 'structural';

    if (impact > 2) return `Strong ${type} support`;
    if (impact > 0) return `Modest ${type} support`;
    if (impact < -2) return `Strong ${type} headwind`;
    if (impact < 0) return `Modest ${type} headwind`;
    return `Neutral ${type} conditions`;
  },

  interpretNetTrendImpact(netImpact) {
    if (netImpact > 3) return 'Trends are strongly supportive across timeframes';
    if (netImpact > 1) return 'Trends are moderately supportive';
    if (netImpact < -3) return 'Trends are presenting significant challenges';
    if (netImpact < -1) return 'Trends are moderately challenging';
    return 'Trend impact is relatively neutral';
  },

  analyzeMonitoring(monitoringAdjustments) {
    return {
      regimes: this.interpretRegimeAdjustment(monitoringAdjustments.components.regimes),
      correlations: this.interpretCorrelationAdjustment(monitoringAdjustments.components.correlations),
      risks: this.interpretRiskAdjustment(monitoringAdjustments.components.risks),
      netImpact: this.interpretMonitoringNetImpact(monitoringAdjustments.total)
    };
  },

  interpretRegimeAdjustment(adjustment) {
    if (adjustment > 2) return 'Current regime is highly supportive';
    if (adjustment > 0) return 'Current regime is modestly supportive';
    if (adjustment < -2) return 'Current regime presents significant challenges';
    if (adjustment < 0) return 'Current regime is modestly challenging';
    return 'Current regime impact is neutral';
  },

  interpretCorrelationAdjustment(adjustment) {
    if (adjustment < -1) return 'Correlation breakdowns suggest increased risk';
    if (adjustment < 0) return 'Minor correlation shifts present';
    return 'Correlation structure remains stable';
  },

  interpretRiskAdjustment(adjustment) {
    if (adjustment > 1) return 'Risk conditions are favorable';
    if (adjustment < -1) return 'Risk conditions are elevated';
    return 'Risk conditions are balanced';
  },

  interpretMonitoringNetImpact(total) {
    if (Math.abs(total) < 1) return 'Real-time conditions are stable';
    return `Real-time conditions are ${total > 0 ? 'supporting' : 'weighing on'} the overall score`;
  },

  generateImplications(finalScore, baseScore) {
    const change = finalScore - baseScore.score;
    const implications = {
      positioning: this.getPositioningImplication(finalScore),
      monitoring: this.getMonitoringImplication(change),
      riskManagement: this.getRiskManagementImplication(finalScore)
    };

    return implications;
  },

  getPositioningImplication(score) {
    if (score >= 75) {
      return 'Conditions support maintaining or increasing market exposure';
    } else if (score >= 55) {
      return 'Balanced positioning with selective exposure remains appropriate';
    } else if (score >= 35) {
      return 'Defensive positioning with reduced market exposure suggested';
    } else {
      return 'Conditions warrant significant defensive positioning';
    }
  },

  getMonitoringImplication(change) {
    if (Math.abs(change) < 2) {
      return 'Continue regular monitoring of market conditions';
    } else if (change > 0) {
      return 'Monitor for confirmation of improving conditions';
    } else {
      return 'Heightened monitoring of risk factors recommended';
    }
  },

  getRiskManagementImplication(score) {
    if (score >= 70) {
      return 'Standard risk management protocols appropriate';
    } else if (score >= 50) {
      return 'Consider tactical hedging for key positions';
    } else if (score >= 30) {
      return 'Implement enhanced risk controls and position sizing';
    } else {
      return 'Strict risk management protocols warranted';
    }
  },

  assessMarketBreadth(regime) {
    if (!regime.breadthData) return 0;
    
    const breadthFactors = {
      advanceDecline: regime.breadthData.advanceDecline > 1.5 ? 1 : 
                      regime.breadthData.advanceDecline < 0.5 ? -1 : 0,
      newHighsLows: regime.breadthData.newHighs > regime.breadthData.newLows ? 1 : 
                    regime.breadthData.newLows > regime.breadthData.newHighs ? -1 : 0,
      participation: regime.breadthData.participation > 0.7 ? 1 :
                    regime.breadthData.participation < 0.3 ? -1 : 0
    };

    return Object.values(breadthFactors).reduce((a, b) => a + b, 0);
  },

  assessTrendStrength(regime) {
    if (!regime.trendData) return 0;

    let strength = 0;
    
    // Price trend assessment
    if (regime.trendData.priceAbove200ma) strength += 1;
    if (regime.trendData.priceAbove50ma) strength += 0.5;
    
    // Momentum assessment
    if (regime.trendData.rsiAbove50) strength += 0.5;
    if (regime.trendData.macdPositive) strength += 0.5;
    
    // Volume trend assessment
    if (regime.trendData.volumeExpanding && regime.trendData.priceRising) strength += 0.5;
    if (regime.trendData.volumeContracting && regime.trendData.priceFalling) strength -= 0.5;

    return strength;
  },

  assessCorrelationRegime(regime) {
    if (!regime.correlationData) return 0;

    let impact = 0;
    
    // Cross-asset correlations
    if (regime.correlationData.spyVix < -0.7) impact += 1;
    if (regime.correlationData.spyTlt < -0.5) impact += 0.5;
    
    // Sector correlations
    if (regime.correlationData.averageSectorCorr < 0.3) impact += 1;
    if (regime.correlationData.averageSectorCorr > 0.7) impact -= 1;
    
    // Style correlations
    if (regime.correlationData.valueGrowthCorr < 0) impact += 0.5;

    return impact;
  },

  assessStructuralTrend(regime) {
    if (!regime.structuralData) return 0;

    let impact = 0;
    
    // Trend structure
    if (regime.structuralData.higherHighs && regime.structuralData.higherLows) impact += 2;
    if (regime.structuralData.lowerLows && regime.structuralData.lowerHighs) impact -= 2;
    
    // Technical structure
    if (regime.structuralData.goldCross) impact += 1;
    if (regime.structuralData.deathCross) impact -= 1;
    
    // Volume structure
    if (regime.structuralData.volumeTrend === 'Expanding') impact += 0.5;
    if (regime.structuralData.volumeTrend === 'Contracting') impact -= 0.5;

    return impact;
  },

  assessMarketCycle(regime) {
    if (!regime.cycleData) return 0;

    const cycleScores = {
      'Early': 2,
      'Mid': 1,
      'Late': -1,
      'Recession': -2
    };

    return cycleScores[regime.cycleData.currentPhase] || 0;
  },

  assessLongTermRegime(regime) {
    if (!regime.longTermData) return 0;

    let impact = 0;
    
    // Secular trend
    if (regime.longTermData.secularTrend === 'Bull') impact += 2;
    if (regime.longTermData.secularTrend === 'Bear') impact -= 2;
    
    // Monetary regime
    if (regime.longTermData.monetaryRegime === 'Accommodative') impact += 1;
    if (regime.longTermData.monetaryRegime === 'Restrictive') impact -= 1;
    
    // Fundamental regime
    if (regime.longTermData.fundamentalRegime === 'Expanding') impact += 1;
    if (regime.longTermData.fundamentalRegime === 'Contracting') impact -= 1;

    return impact;
  },

  analyzeRelationships(relationshipScores) {
    if (!relationshipScores) return null;

    return {
      industry: {
        score: relationshipScores.industry.score,
        analysis: this.interpretIndustryScores(relationshipScores.industry)
      },
      macro: {
        score: relationshipScores.macro.score,
        analysis: this.interpretMacroScores(relationshipScores.macro)
      },
      composite: {
        score: relationshipScores.composite.score,
        interpretation: relationshipScores.composite.interpretation
      }
    };
  },

  interpretIndustryScores(industryScores) {
    const strengthMap = {
      strong: score => score >= 70,
      moderate: score => score >= 50 && score < 70,
      weak: score => score < 50
    };

    const strength = Object.entries(strengthMap)
      .find(([_, test]) => test(industryScores.score))[0];

    return {
      strength,
      implications: this.getIndustryImplications(strength, industryScores.details)
    };
  },

  interpretMacroScores(macroScores) {
    const strengthMap = {
      strong: score => score >= 70,
      moderate: score => score >= 50 && score < 70,
      weak: score => score < 50
    };

    const strength = Object.entries(strengthMap)
      .find(([_, test]) => test(macroScores.score))[0];

    return {
      strength,
      implications: this.getMacroImplications(strength, macroScores.details)
    };
  },

  getIndustryImplications(strength, details) {
    const implications = {
      strong: "Industry relationships show robust internal dynamics supporting current market trends",
      moderate: "Industry relationships indicate stable but mixed sector dynamics",
      weak: "Industry relationships suggest internal market stress or rotation"
    };

    return implications[strength] || "Industry relationship analysis inconclusive";
  },

  getMacroImplications(strength, details) {
    const implications = {
      strong: "Macro relationships indicate supportive cross-asset environment",
      moderate: "Macro relationships suggest balanced cross-asset dynamics",
      weak: "Macro relationships point to stress in cross-asset dynamics"
    };

    return implications[strength] || "Macro relationship analysis inconclusive";
  }
};

export default finalScoreIntegration;
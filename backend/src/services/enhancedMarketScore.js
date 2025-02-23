import timeframeAnalysis from './timeframeAnalysis.js';
import technicalAnalysis from './technicalAnalysis.js';
import marketRelationships from './marketRelationships.js';
import NodeCache from 'node-cache';
import advancedAnalysis from './advancedAnalysis.js';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const enhancedAnalysisIntegration = {
  async getAdvancedInsights(data) {
    try {
      // Get all advanced analysis components
      const trendChanges = await advancedAnalysis.analyzeTrendChanges(data);
      const regimeAnalysis = await advancedAnalysis.detectRegimeChange(data);
      const riskAssessment = await advancedAnalysis.assessRiskLevels(data);

      // Analyze key relationships
      const keySymbols = ['SPY.US', 'TLT.US', 'GLD.US', 'UUP.US'];
      const correlations = await advancedAnalysis.analyzeCorrelations(keySymbols);

      return {
        trends: trendChanges,
        regime: regimeAnalysis,
        risk: riskAssessment,
        correlations
      };
    } catch (error) {
      console.error('Error getting advanced insights:', error);
      return null;
    }
  },

  async enhanceScoreWithAdvancedAnalysis(baseScore) {
    try {
      const data = await marketService.getHistoricalData('SPY.US');
      const advancedInsights = await this.getAdvancedInsights(data);
      
      if (!advancedInsights) return baseScore;

      // Adjust score based on advanced analysis
      let scoreAdjustment = 0;
      
      // Trend analysis impact
      if (advancedInsights.trends[200]?.significant) {
        scoreAdjustment += advancedInsights.trends[200].trendChange > 0 ? 5 : -5;
      }

      // Regime analysis impact
      const currentRegime = advancedInsights.regime[50]?.riskRegime;
      if (currentRegime === 'Risk-On') scoreAdjustment += 5;
      if (currentRegime === 'Risk-Off') scoreAdjustment -= 5;

      // Risk assessment impact
      const riskLevel = advancedInsights.risk.level;
      if (riskLevel === 'Low') scoreAdjustment += 5;
      if (riskLevel === 'High') scoreAdjustment -= 5;

      // Calculate final adjusted score
      const adjustedScore = Math.min(100, Math.max(0, baseScore.score + scoreAdjustment));

      return {
        ...baseScore,
        score: adjustedScore,
        advancedAnalysis: {
          insights: advancedInsights,
          scoreAdjustment,
          interpretation: this.generateAdvancedInterpretation(advancedInsights)
        }
      };
    } catch (error) {
      console.error('Error enhancing score with advanced analysis:', error);
      return baseScore;
    }
  },

  generateAdvancedInterpretation(insights) {
    const interpretations = {
      trends: this.interpretTrends(insights.trends),
      regime: this.interpretRegime(insights.regime),
      risk: this.interpretRisk(insights.risk),
      correlations: this.interpretCorrelations(insights.correlations)
    };

    return {
      summary: this.generateAdvancedSummary(interpretations),
      details: interpretations
    };
  },

  interpretTrends(trends) {
    const interpretations = {};
    for (const [period, trend] of Object.entries(trends)) {
      interpretations[period] = {
        direction: trend.longTermTrend > 0 ? 'upward' : 'downward',
        strength: trend.strength > 1.5 ? 'strong' : trend.strength > 0.5 ? 'moderate' : 'weak',
        change: trend.significant ? 
          `significant ${trend.trendChange > 0 ? 'improvement' : 'deterioration'}` : 
          'no significant change'
      };
    }
    return interpretations;
  },

  interpretRegime(regimeData) {
    const currentRegime = regimeData[50]; // Use 50-day analysis as current
    return {
      current: currentRegime.riskRegime,
      volatility: currentRegime.volatilityRegime,
      momentum: currentRegime.momentumRegime,
      implications: this.getRegimeImplications(currentRegime)
    };
  },

  getRegimeImplications(regime) {
    if (regime.riskRegime === 'Risk-On' && regime.momentumRegime === 'Strong') {
      return 'Strong risk appetite supports maintaining market exposure';
    }
    if (regime.riskRegime === 'Risk-Off' && regime.volatilityRegime === 'High') {
      return 'High risk conditions suggest defensive positioning';
    }
    return 'Mixed conditions warrant balanced exposure';
  },

  interpretRisk(riskAssessment) {
    return {
      level: riskAssessment.level,
      components: riskAssessment.components,
      analysis: riskAssessment.analysis,
      actionable: this.getRiskActionItems(riskAssessment)
    };
  },

  getRiskActionItems(riskAssessment) {
    const actions = [];
    if (riskAssessment.level === 'High') {
      actions.push('Reduce equity exposure');
      actions.push('Increase defensive positions');
      actions.push('Implement hedging strategies');
    } else if (riskAssessment.level === 'Low') {
      actions.push('Maintain market exposure');
      actions.push('Focus on sector rotation opportunities');
      actions.push('Monitor for trend continuation');
    }
    return actions;
  },

  interpretCorrelations(correlations) {
    const insights = [];
    for (const [asset1, correlationData] of Object.entries(correlations)) {
      for (const [asset2, correlation] of Object.entries(correlationData)) {
        insights.push({
          pair: [asset1, asset2],
          correlation,
          strength: Math.abs(correlation) > 0.7 ? 'strong' : 
                   Math.abs(correlation) > 0.3 ? 'moderate' : 'weak',
          type: correlation > 0 ? 'positive' : 'negative'
        });
      }
    }
    return insights;
  },

  generateAdvancedSummary(interpretations) {
    const { trends, regime, risk } = interpretations;
    
    const trendSummary = trends[200] ? 
      `Long-term trend is ${trends[200].direction} with ${trends[200].strength} momentum` : '';
    
    const regimeSummary = `Market is in a ${regime.current} regime with ${regime.volatility} volatility`;
    
    const riskSummary = `Risk level is ${risk.level} with ${risk.actionable.length} recommended actions`;

    return `${trendSummary}. ${regimeSummary}. ${riskSummary}.`;
  }
};

const enhancedMarketScore = {
  async calculateEnhancedScore() {
    const cacheKey = 'enhanced_market_score';
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  
    try {
      // Get base score calculations
      const timeframeScores = await timeframeAnalysis.calculateTimeframeScores();
      const technicalFactors = await technicalAnalysis.calculateTechnicalFactors();
      const relationships = await marketRelationships.analyzeMarketRelationships();
  
      const baseScore = this.calculateFinalScore({
        timeframeScore: this.calculateTimeframeWeightedScore(timeframeScores),
        technicalScore: technicalFactors,
        relationshipScores: relationships
      });
  
      // Enhance with advanced analysis
      const enhancedScore = await enhancedAnalysisIntegration.enhanceScoreWithAdvancedAnalysis(baseScore);
  
      // Generate final result
      const result = {
        ...enhancedScore,
        grade: this.calculateGrade(enhancedScore.score),
        analysis: this.generateEnhancedAnalysis({
          ...enhancedScore,
          timeframeScores,
          technicalFactors,
          relationships
        }),
        timestamp: Date.now()
      };
  
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error calculating enhanced market score:', error);
      throw error;
    }
  },

  calculateTimeframeWeightedScore(timeframeScores) {
    const weights = {
      yearly: 0.50,
      quarterly: 0.25,
      monthly: 0.15,
      weekly: 0.075,
      daily: 0.025
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const [timeframe, score] of Object.entries(timeframeScores)) {
      const weight = weights[timeframe] || 0;
      weightedScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 50;
  },

  calculateFinalScore({ timeframeScore, technicalScore, relationshipScores }) {
    // Component weights
    const weights = {
      timeframe: 0.4,      // 40% weight to timeframe analysis
      technical: 0.3,      // 30% weight to technical factors
      industry: 0.15,      // 15% weight to industry relationships
      macro: 0.15          // 15% weight to macro relationships
    };

    // Calculate weighted scores
    const weightedTimeframe = timeframeScore * weights.timeframe;
    const weightedTechnical = technicalScore.score * weights.technical;
    const weightedIndustry = relationshipScores.industry.score * weights.industry;
    const weightedMacro = relationshipScores.macro.score * weights.macro;

    const finalScore = Math.round(
      weightedTimeframe +
      weightedTechnical +
      weightedIndustry +
      weightedMacro
    );

    return {
      score: Math.min(100, Math.max(0, finalScore)),
      components: {
        timeframe: {
          score: timeframeScore,
          weight: weights.timeframe
        },
        technical: {
          score: technicalScore.score,
          weight: weights.technical,
          details: technicalScore.details
        },
        industry: {
          score: relationshipScores.industry.score,
          weight: weights.industry,
          details: relationshipScores.industry.details
        },
        macro: {
          score: relationshipScores.macro.score,
          weight: weights.macro,
          details: relationshipScores.macro.details
        }
      }
    };
  },

  calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 77) return 'B+';
    if (score >= 73) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 67) return 'C+';
    if (score >= 63) return 'C';
    if (score >= 60) return 'C-';
    if (score >= 57) return 'D+';
    if (score >= 53) return 'D';
    if (score >= 50) return 'D-';
    return 'F';
  },

  generateEnhancedAnalysis({ timeframeScores, technicalFactors, relationships, finalScore }) {
    const riskLevel = this.assessRiskLevel(finalScore);
    const marketPhase = this.determineMarketPhase(finalScore.components);
    
    return {
      basic: this.generateBasicAnalysis({
        finalScore,
        riskLevel,
        marketPhase,
        relationships
      }),
      advanced: this.generateAdvancedAnalysis({
        timeframeScores,
        technicalFactors,
        relationships,
        riskLevel,
        marketPhase
      })
    };
  },

  assessRiskLevel(finalScore) {
    const score = finalScore.score;
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Elevated';
    return 'High';
  },

  determineMarketPhase(components) {
    const { technical, macro } = components;
    
    // Complex market phase determination based on multiple factors
    if (technical.score > 80 && macro.score > 70) return 'Expansion';
    if (technical.score > 60 && macro.score > 50) return 'Recovery';
    if (technical.score < 40 && macro.score < 40) return 'Contraction';
    if (technical.score < 30) return 'Risk-Off';
    return 'Transition';
  },

  generateBasicAnalysis({ finalScore, riskLevel, marketPhase, relationships }) {
    return `Market Overview (Score: ${finalScore.score}, Grade: ${this.calculateGrade(finalScore.score)})

Current market conditions suggest ${this.getMarketConditionDescription(finalScore.score)}.

Risk Level: ${riskLevel}
Market Phase: ${marketPhase}

Key Insights:
${this.generateBasicInsights(relationships)}

Bottom Line:
${this.generateBasicOutlook(finalScore.score, riskLevel)}`;
  },

  generateAdvancedAnalysis({ timeframeScores, technicalFactors, relationships, riskLevel, marketPhase }) {
    return `Comprehensive Market Analysis

Market Structure:
- Current Phase: ${marketPhase}
- Risk Level: ${riskLevel}
- Technical Framework: ${this.generateTechnicalSummary(technicalFactors)}

Timeframe Analysis:
${this.generateTimeframeAnalysis(timeframeScores)}

Relationship Analysis:
${this.generateRelationshipAnalysis(relationships)}

Strategic Implications:
${this.generateStrategicImplications(riskLevel, marketPhase)}`;
  },

  getMarketConditionDescription(score) {
    if (score >= 80) return 'a strong risk/reward environment for equity exposure';
    if (score >= 60) return 'a positive environment with moderate risks';
    if (score >= 40) return 'a mixed environment requiring selective positioning';
    return 'a challenging environment warranting defensive positioning';
  },

  generateBasicInsights(relationships) {
    const insights = [];
    
    // Add key relationship insights
    if (relationships.industry.details.tech) {
      insights.push(relationships.industry.details.tech.interpretation);
    }
    if (relationships.macro.details.yields) {
      insights.push(relationships.macro.details.yields.interpretation);
    }
    
    return insights.join('\
');
  },

  generateBasicOutlook(score, riskLevel) {
    if (score >= 80) return 'Current conditions strongly support maintaining market exposure while monitoring risk levels.';
    if (score >= 60) return 'The environment supports measured investment with balanced risk management.';
    if (score >= 40) return 'Selective opportunities exist but require careful position sizing and risk management.';
    return 'Capital preservation should be prioritized with defensive positioning.';
  },

  generateTechnicalSummary(technicalFactors) {
    return `Technical conditions show ${technicalFactors.score >= 60 ? 'strength' : 'weakness'} 
    with ${technicalFactors.movingAverages.details.priceVsMa200 > 0 ? 'positive' : 'negative'} 
    long-term trends.`;
  },

  generateTimeframeAnalysis(timeframeScores) {
    return Object.entries(timeframeScores)
      .map(([timeframe, score]) => 
        `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}: 
        Score ${score.toFixed(1)} - ${this.getTimeframeInterpretation(score)}`)
      .join('\n');
  },

  getTimeframeInterpretation(score) {
    if (score >= 70) return 'Strong positive trends';
    if (score >= 50) return 'Moderately positive';
    if (score >= 30) return 'Mixed conditions';
    return 'Challenging conditions';
  },

  generateRelationshipAnalysis(relationships) {
    return `Industry Relationships:
${Object.entries(relationships.industry.details)
  .map(([key, detail]) => `- ${key}: ${detail.interpretation}`)
  .join('\n')}

Macro Relationships:
${Object.entries(relationships.macro.details)
  .map(([key, detail]) => `- ${key}: ${detail.interpretation}`)
  .join('\n')}`;
  },

  generateStrategicImplications(riskLevel, marketPhase) {
    const implications = {
      Expansion: {
        Low: 'Maintain aggressive positioning with broad market exposure',
        Moderate: 'Balanced exposure with sector rotation strategies',
        Elevated: 'Selective exposure with increased hedging',
        High: 'Defensive positioning with strict risk controls'
      },
      Recovery: {
        Low: 'Opportunistic positioning in cyclical sectors',
        Moderate: 'Balanced approach with quality focus',
        Elevated: 'Selective opportunities with strong risk management',
        High: 'Capital preservation with opportunistic positioning'
      },
      Contraction: {
        Low: 'Selective opportunities in defensive sectors',
        Moderate: 'Focus on quality and dividend stability',
        Elevated: 'Defensive positioning with reduced exposure',
        High: 'Maximum defensive positioning'
      },
      'Risk-Off': {
        Low: 'Tactical opportunities with strong risk controls',
        Moderate: 'Defensive positioning with selective exposure',
        Elevated: 'Minimum equity exposure',
        High: 'Capital preservation focus'
      },
      Transition: {
        Low: 'Balanced positioning with sector rotation',
        Moderate: 'Quality focus with selective exposure',
        Elevated: 'Defensive bias with opportunistic positioning',
        High: 'Defensive positioning with tactical flexibility'
      }
    };

    return implications[marketPhase]?.[riskLevel] || 
           'Maintain balanced positioning with strong risk management';
  }
};

export default enhancedMarketScore;
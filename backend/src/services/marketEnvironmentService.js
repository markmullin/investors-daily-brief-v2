import { marketService } from './apiServices.js';
import braveService from './braveService.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

const marketEnvironmentService = {
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

  async calculateMarketScore() {
    const cacheKey = 'market_environment_score';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const marketData = await marketService.getData();
      const sectorData = await marketService.getSectorData();
      
      const technicalScore = await this.calculateTechnicalScore(marketData);
      const breadthScore = await this.calculateBreadthScore(sectorData);
      const sentimentScore = await this.calculateSentimentScore();
      
      const finalScore = Math.round(
        (technicalScore * 0.4) + 
        (breadthScore * 0.3) + 
        (sentimentScore * 0.3)
      );

      const result = {
        overallScore: finalScore,
        grade: this.calculateGrade(finalScore),
        components: {
          technical: technicalScore,
          technicalGrade: this.calculateGrade(technicalScore),
          breadth: breadthScore,
          breadthGrade: this.calculateGrade(breadthScore),
          sentiment: sentimentScore,
          sentimentGrade: this.calculateGrade(sentimentScore)
        },
        analysis: this.generateAnalysis(finalScore, {
          technical: technicalScore,
          breadth: breadthScore,
          sentiment: sentimentScore
        }),
        timestamp: Date.now()
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error calculating market environment:', error);
      throw error;
    }
  },

  async calculateTechnicalScore(marketData) {
    const spyData = marketData['SPY.US'];
    if (!spyData) return 50;

    let score = 75;

    const history = await marketService.getHistoricalData('SPY.US');
    const ma50 = this.calculateMA(history, 50);
    const ma200 = this.calculateMA(history, 200);
    
    if (spyData.close > ma50) score += 15;
    if (spyData.close > ma200) score += 15;

    const rsi = this.calculateRSI(history);
    if (rsi > 70) score -= 10;
    else if (rsi < 30) score += 10;
    
    const vix = await marketService.getDataForSymbols(['VIXY']);
    if (vix.VIXY?.close < 35) score += 25;
    else if (vix.VIXY?.close < 40) score += 20;
    else if (vix.VIXY?.close < 45) score += 15;
    else if (vix.VIXY?.close > 60) score -= 15;
    else if (vix.VIXY?.close > 50) score -= 10;

    return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
  },

  async calculateBreadthScore(sectorData) {
    let score = 75;
    
    const breadthMetrics = this.analyzeBreadth(sectorData);
    
    const advDeclineRatio = breadthMetrics.advanceDecline;
    if (advDeclineRatio > 2.5) score += 25;
    else if (advDeclineRatio > 2.0) score += 20;
    else if (advDeclineRatio > 1.5) score += 15;
    else if (advDeclineRatio < 0.5) score -= 15;
    else if (advDeclineRatio < 0.75) score -= 10;
    
    const participation = breadthMetrics.participation;
    if (participation > 0.85) score += 25;
    else if (participation > 0.75) score += 20;
    else if (participation > 0.65) score += 15;
    else if (participation < 0.45) score -= 15;
    else if (participation < 0.55) score -= 10;
    
    const rotationStrength = breadthMetrics.strength;
    const breadthThrust = breadthMetrics.breadthThrust;
    
    if (rotationStrength > 4 && breadthThrust > 0.8) score += 25;
    else if (rotationStrength > 2 && breadthThrust > 0.6) score += 20;
    else if (rotationStrength > 0 && breadthThrust > 0.5) score += 15;
    else if (rotationStrength < -2 || breadthThrust < 0.3) score -= 15;

    return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
  },

  async calculateSentimentScore() {
    try {
      let score = 75;
      
      const vixData = await marketService.getDataForSymbols(['VIXY']);
      const vixy = vixData.VIXY?.close || 20;
      
      if (vixy < 35) score += 25;
      else if (vixy < 40) score += 20;
      else if (vixy < 45) score += 15;
      else if (vixy > 60) score -= 15;
      else if (vixy > 50) score -= 10;

      const symbols = ['SPY', 'QQQ', 'IWM'];
      const sentiments = await Promise.all(
        symbols.map(sym => braveService.getMarketSentiment(sym))
      );
      const avgSentiment = sentiments.reduce((acc, s) => acc + s.sentiment, 0) / sentiments.length;
      
      if (avgSentiment > 0.8) score += 35;
      else if (avgSentiment > 0.6) score += 25;
      else if (avgSentiment > 0.4) score += 15;
      else if (avgSentiment < 0.2) score -= 25;
      else if (avgSentiment < 0.4) score -= 15;

      return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
    } catch (error) {
      console.error('Error calculating sentiment:', error);
      return 50;
    }
  },

  calculateMA(data, period) {
    return data.slice(-period).reduce((sum, day) => sum + day.price, 0) / period;
  },

  calculateRSI(data, period = 14) {
    const changes = data.slice(-period-1).map((d, i, arr) => 
      i > 0 ? d.price - arr[i-1].price : 0
    ).slice(1);
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.reduce((a, b) => a + b) / period;
    const avgLoss = losses.reduce((a, b) => a + b) / period;
    
    const rs = avgGain / (avgLoss || 1);
    return 100 - (100 / (1 + rs));
  },

  analyzeBreadth(sectorData) {
    const advancing = sectorData.filter(s => s.change_p > 0);
    const declining = sectorData.filter(s => s.change_p < 0);
    const strong = sectorData.filter(s => s.change_p > 1);
    const weak = sectorData.filter(s => s.change_p < -1);

    return {
      advanceDecline: advancing.length / Math.max(1, declining.length),
      participation: (advancing.length + declining.length) / sectorData.length,
      strength: strong.length - weak.length,
      breadthThrust: advancing.length / sectorData.length
    };
  },

  generateAnalysis(score, components) {
    const { technical, breadth, sentiment } = components;
    const marketPhase = this.determineMarketPhase(components);
    const riskLevel = this.assessRiskLevel(components);

    const basic = `Market Overview: ${this.getMarketConditionNatural(score)}

Our analysis shows the market is in a ${marketPhase} phase. Here's what this means:

Technical Analysis: ${this.getTechnicalInsightBasic(technical)}

Market Health: ${this.getBreadthInsightBasic(breadth)}

Investor Sentiment: ${this.getSentimentInsightBasic(sentiment)}

Risk Level: ${this.getRiskInsightBasic(riskLevel)}

Bottom Line: ${this.generateBasicOutlook(score)}`;

    const advanced = `Market Analysis (${new Date().toLocaleDateString()}):

The market is exhibiting ${this.getMarketConditionNatural(score)} with the following key metrics:

Technical Framework: ${this.getTechnicalInsightAdvanced(technical)}

Market Internals: ${this.getBreadthInsightAdvanced(breadth)}

Sentiment Analysis: ${this.getSentimentInsightAdvanced(sentiment)}

Current Phase: ${marketPhase} with ${riskLevel} risk levels.
${this.getRiskInsightAdvanced(riskLevel)}

Strategic Outlook: ${this.generateAdvancedOutlook(technical, breadth, sentiment)}`;

    return { basic, advanced };
  },

  getMarketConditionNatural(score) {
    if (score >= 80) return "remarkably strong conditions";
    if (score >= 60) return "generally positive conditions";
    if (score >= 40) return "mixed but stable conditions";
    if (score >= 20) return "challenging conditions";
    return "significantly stressed conditions";
  },

  getTechnicalInsightBasic(score) {
    if (score >= 70) return "Price trends are showing strong upward momentum, with most indicators suggesting healthy buying interest.";
    if (score >= 50) return "Price trends are positive but showing some mixed signals, suggesting steady but cautious progress.";
    if (score >= 30) return "Price trends are showing some weakness, suggesting a more careful approach may be needed.";
    return "Price trends are showing concerning signs of weakness, suggesting defensive positioning may be appropriate.";
  },

  getTechnicalInsightAdvanced(score) {
    if (score >= 70) return "Technical framework exhibits robust momentum across multiple timeframes with constructive price action.";
    if (score >= 50) return "Price structure maintains positive trajectory with key technical levels holding support.";
    if (score >= 30) return "Technical configuration showing deterioration with key support levels under pressure.";
    return "Technical framework has weakened considerably with multiple support breaches.";
  },

  getBreadthInsightBasic(score) {
    if (score >= 70) return "Most stocks are participating in the market's movement, showing broad-based strength.";
    if (score >= 50) return "Market participation is reasonably healthy, though some sectors are stronger than others.";
    if (score >= 30) return "Fewer stocks are participating in market moves, suggesting increasing selectivity is needed.";
    return "Market participation has become very narrow, with only a small group of stocks showing strength.";
  },

  getBreadthInsightAdvanced(score) {
    if (score >= 70) return "Market internals exhibit robust breadth confirmation with strong advance-decline metrics.";
    if (score >= 50) return "Breadth metrics maintain constructive configuration despite some divergences.";
    if (score >= 30) return "Internal metrics showing notable deterioration across key breadth indicators.";
    return "Breadth measures indicate significant internal weakness with sustained distribution patterns.";
  },

  getSentimentInsightBasic(score) {
    if (score >= 70) return "Investors are showing confidence without excessive optimism.";
    if (score >= 50) return "Investor sentiment is balanced, suggesting room for further gains.";
    if (score >= 30) return "Investors are showing caution, which can create opportunities.";
    return "Investor sentiment is very negative, which historically can signal potential turning points.";
  },

  getSentimentInsightAdvanced(score) {
    if (score >= 70) return "Sentiment metrics indicate strong institutional conviction without extreme readings.";
    if (score >= 50) return "Sentiment configuration remains constructive with balanced positioning.";
    if (score >= 30) return "Sentiment indicators reflect increasing risk aversion with defensive positioning.";
    return "Sentiment measures approach historical extremes suggesting potential capitulation levels.";
  },

  getRiskInsightBasic(riskLevel) {
    switch(riskLevel) {
      case "below-average": return "Market conditions suggest lower than normal risk.";
      case "moderate": return "Risk levels are normal for current market conditions.";
      case "elevated": return "Markets are showing higher than normal risk levels.";
      case "high": return "Risk levels are significantly elevated.";
      default: return "Risk levels are within normal ranges.";
    }
  },

  getRiskInsightAdvanced(riskLevel) {
    switch(riskLevel) {
      case "below-average": return "Risk metrics indicate favorable risk/reward dynamics.";
      case "moderate": return "Risk parameters align with historical norms.";
      case "elevated": return "Risk metrics suggest deteriorating market dynamics.";
      case "high": return "Risk measures indicate significant deviation from historical norms.";
      default: return "Risk parameters remain within standard deviation bands.";
    }
  },

  generateBasicOutlook(score) {
    if (score >= 80) return "Current conditions strongly support maintaining market exposure while watching risk levels.";
    if (score >= 60) return "The environment supports measured investment while keeping some defensive positions.";
    if (score >= 40) return "A balanced approach between growth and defensive positions is warranted.";
    if (score >= 20) return "Focus on high-quality positions and consider increased defensive allocations.";
    return "Capital preservation should be the primary focus.";
  },

  generateAdvancedOutlook(technical, breadth, sentiment) {
    let outlook = "";
    if (technical > 70) {
      outlook += "Technical configuration supports maintaining tactical exposure. ";
    } else if (technical < 30) {
      outlook += "Technical deterioration warrants defensive positioning. ";
    }
    
    if (breadth > 70) {
      outlook += "Broad participation supports market resilience. ";
    } else if (breadth < 30) {
      outlook += "Narrow participation suggests selective exposure. ";
    }
    
    if (sentiment > 70) {
      outlook += "Monitor sentiment extremes for potential shifts.";
    } else if (sentiment < 30) {
      outlook += "Sentiment extremes may present contrarian opportunities.";
    }
    
    return outlook;
  },

  determineMarketPhase(components) {
    const { technical, breadth, sentiment } = components;
    
    if (technical > 80 && breadth > 70) return "strong expansion";
    if (technical > 60 && breadth > 50) return "steady growth";
    if (technical < 40 && breadth < 40) return "contraction";
    if (technical < 30 && sentiment < 30) return "risk-off";
    if (sentiment > 70 && technical < 50) return "recovery";
    return "consolidation";
  },

  assessRiskLevel(components) {
    const { technical, breadth, sentiment } = components;
    const avgScore = (technical + breadth + sentiment) / 3;
    
    if (avgScore > 80) return "below-average";
    if (avgScore > 60) return "moderate";
    if (avgScore < 40) return "elevated";
    if (avgScore < 30) return "high";
    return "normal";
  }
};

export default marketEnvironmentService;
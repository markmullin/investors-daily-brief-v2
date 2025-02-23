import { marketService } from './apiServices.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const advancedAnalysis = {
  async analyzeTrendChanges(data) {
    const periods = [50, 100, 200];
    const trends = {};
    
    for (const period of periods) {
      trends[period] = this.analyzePeriodTrend(data, period);
    }
    
    return trends;
  },

  analyzePeriodTrend(data, period) {
    const recentData = data.slice(-period);
    if (recentData.length < period) return null;

    const longTermTrend = this.calculateTrendStrength(recentData);
    const shortTermTrend = this.calculateTrendStrength(recentData.slice(-20));
    const strength = this.calculateTrendStrength(recentData);
    const trendChange = shortTermTrend - longTermTrend;

    return {
      longTermTrend,
      shortTermTrend,
      strength,
      trendChange,
      significant: Math.abs(trendChange) > 1.5
    };
  },

  calculateTrendStrength(data) {
    if (!data.length) return 0;
    const prices = data.map(d => d.price);
    const x = Array.from({length: data.length}, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, i) => a + i * prices[i], 0);
    const sumX2 = x.reduce((a, i) => a + i * i, 0);
    
    const n = data.length;
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  },

  async detectRegimeChange(data) {
    const periods = [50, 100, 200];
    const regimes = {
      current: {},
      previous: {},
      changes: {}
    };

    for (const period of periods) {
      const periodData = data.slice(-period);
      if (periodData.length < period) continue;

      const currentRegime = this.analyzeRegime(periodData);
      const previousRegime = this.analyzeRegime(periodData.slice(0, -20));

      regimes.current[period] = currentRegime;
      regimes.previous[period] = previousRegime;
      regimes.changes[period] = this.detectChanges(currentRegime, previousRegime);
    }

    return regimes;
  },

  analyzeRegime(data) {
    return {
      riskRegime: this.determineRiskRegime(data),
      volatilityRegime: this.determineVolatilityRegime(data),
      momentumRegime: this.determineMomentumRegime(data),
      correlationRegime: this.determineCorrelationRegime(data)
    };
  },

  determineRiskRegime(data) {
    const returns = this.calculateReturns(data);
    const volatility = this.calculateVolatility(returns);
    const trend = this.calculateTrendStrength(data);

    if (trend > 1 && volatility < 15) return 'Risk-On';
    if (trend < -1 || volatility > 25) return 'Risk-Off';
    return 'Neutral';
  },

  determineVolatilityRegime(data) {
    const returns = this.calculateReturns(data);
    const volatility = this.calculateVolatility(returns);

    if (volatility < 10) return 'Low';
    if (volatility > 20) return 'High';
    return 'Normal';
  },

  determineMomentumRegime(data) {
    const trend = this.calculateTrendStrength(data);
    const shortTrend = this.calculateTrendStrength(data.slice(-20));

    if (trend > 1 && shortTrend > 0) return 'Strong';
    if (trend < -1 && shortTrend < 0) return 'Weak';
    return 'Neutral';
  },

  determineCorrelationRegime(data) {
    return 'Normal';  // Placeholder for correlation regime
  },

  detectChanges(current, previous) {
    const changes = {};
    for (const [key, value] of Object.entries(current)) {
      if (value !== previous[key]) {
        changes[key] = {
          from: previous[key],
          to: value,
          changed: true
        };
      }
    }
    return changes;
  },

  async assessRiskLevels(data) {
    const analysis = {
      level: this.calculateRiskLevel(data),
      components: this.analyzeRiskComponents(data),
      changes: await this.detectRiskChanges(data)
    };

    analysis.analysis = this.generateRiskAnalysis(analysis);
    return analysis;
  },

  calculateRiskLevel(data) {
    const returns = this.calculateReturns(data);
    const volatility = this.calculateVolatility(returns);
    const trend = this.calculateTrendStrength(data);
    const drawdown = this.calculateMaxDrawdown(data);

    let riskScore = 0;
    
    // Volatility impact
    if (volatility > 25) riskScore += 2;
    else if (volatility > 15) riskScore += 1;
    
    // Trend impact
    if (trend < -1) riskScore += 1;
    if (trend < -2) riskScore += 1;
    
    // Drawdown impact
    if (drawdown < -10) riskScore += 1;
    if (drawdown < -20) riskScore += 1;

    if (riskScore >= 4) return 'High';
    if (riskScore >= 2) return 'Elevated';
    if (riskScore >= 1) return 'Moderate';
    return 'Low';
  },

  analyzeRiskComponents(data) {
    const returns = this.calculateReturns(data);
    return {
      volatility: this.calculateVolatility(returns),
      trend: this.calculateTrendStrength(data),
      drawdown: this.calculateMaxDrawdown(data),
      momentum: this.calculateMomentum(data)
    };
  },

  async detectRiskChanges(data) {
    const currentRisk = this.calculateRiskLevel(data);
    const previousRisk = this.calculateRiskLevel(data.slice(0, -20));

    return {
      level: {
        from: previousRisk,
        to: currentRisk,
        changed: previousRisk !== currentRisk
      }
    };
  },

  generateRiskAnalysis(riskData) {
    const analyses = {
      High: "Significant risk conditions warrant defensive positioning",
      Elevated: "Elevated risk levels suggest reduced exposure",
      Moderate: "Balanced risk conditions support measured exposure",
      Low: "Favorable risk conditions for market participation"
    };

    return analyses[riskData.level] || "Risk conditions require monitoring";
  },

  calculateReturns(data) {
    return data.map((d, i, arr) => 
      i > 0 ? (d.price / arr[i-1].price - 1) * 100 : 0
    ).slice(1);
  },

  calculateVolatility(returns) {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
    return Math.sqrt(variance * 252);  // Annualized
  },

  calculateMaxDrawdown(data) {
    let maxDrawdown = 0;
    let peak = data[0].price;

    for (const point of data) {
      if (point.price > peak) {
        peak = point.price;
      }
      const drawdown = (point.price - peak) / peak * 100;
      maxDrawdown = Math.min(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  },

  calculateMomentum(data) {
    const shortTerm = this.calculateTrendStrength(data.slice(-20));
    const mediumTerm = this.calculateTrendStrength(data.slice(-50));
    return (shortTerm + mediumTerm) / 2;
  },

  async analyzeCorrelations(symbols) {
    try {
      const data = await Promise.all(
        symbols.map(sym => marketService.getHistoricalData(sym))
      );
      
      const correlations = {};
      for (let i = 0; i < symbols.length; i++) {
        correlations[symbols[i]] = {};
        for (let j = i + 1; j < symbols.length; j++) {
          const correlation = this.calculateCorrelation(
            this.calculateReturns(data[i]),
            this.calculateReturns(data[j])
          );
          correlations[symbols[i]][symbols[j]] = correlation;
        }
      }

      return correlations;
    } catch (error) {
      console.error('Error analyzing correlations:', error);
      return {};
    }
  },

  calculateCorrelation(returns1, returns2) {
    const n = Math.min(returns1.length, returns2.length);
    if (n < 2) return 0;

    returns1 = returns1.slice(-n);
    returns2 = returns2.slice(-n);

    const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
    const mean2 = returns2.reduce((a, b) => a + b, 0) / n;

    const variance1 = returns1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
    const variance2 = returns2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0);

    const covariance = returns1.reduce((a, b, i) => 
      a + (b - mean1) * (returns2[i] - mean2), 0
    );

    return covariance / Math.sqrt(variance1 * variance2);
  }
};

export default advancedAnalysis;
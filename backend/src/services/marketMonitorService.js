import { marketService } from './apiServices.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const marketMonitorService = {
  async monitorMarketConditions() {
    try {
      // Get market data
      const marketData = await marketService.getData();
      
      // Monitor regimes
      const regimeAlerts = await this.monitorRegimeChanges();
      
      // Monitor correlations
      const correlationAlerts = await this.monitorCorrelations();
      
      // Monitor risk conditions
      const riskAlerts = await this.monitorRiskConditions();
      
      return {
        regimeAlerts,
        correlationAlerts,
        riskAlerts,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error monitoring market conditions:', error);
      throw error;
    }
  },

  async monitorRegimeChanges() {
    const cacheKey = 'regime_monitoring';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const marketData = await marketService.getData();
      const spyData = marketData['SPY.US'];
      if (!spyData) return this.getDefaultRegimeData();

      const current = this.calculateRegimes(spyData);
      const previous = this.getPreviousRegimes();
      const changes = this.detectRegimeChanges(current, previous);
      const alerts = this.generateRegimeAlerts(changes);

      const result = {
        current,
        previous,
        changes,
        alerts
      };

      cache.set('previous_regimes', current);
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error monitoring regimes:', error);
      return this.getDefaultRegimeData();
    }
  },

  getDefaultRegimeData() {
    return {
      current: {
        50: { riskRegime: 'Neutral', volatilityRegime: 'Normal', momentumRegime: 'Neutral' },
        100: { riskRegime: 'Neutral', volatilityRegime: 'Normal', momentumRegime: 'Neutral' },
        200: { riskRegime: 'Neutral', volatilityRegime: 'Normal', momentumRegime: 'Neutral' }
      },
      previous: {},
      changes: {},
      alerts: []
    };
  },

  calculateRegimes(marketData) {
    const periods = [50, 100, 200];
    const regimes = {};

    for (const period of periods) {
      regimes[period] = {
        riskRegime: this.calculateRiskRegime(marketData, period),
        volatilityRegime: this.calculateVolatilityRegime(marketData, period),
        momentumRegime: this.calculateMomentumRegime(marketData, period)
      };
    }

    return regimes;
  },

  calculateRiskRegime(data, period) {
    const price = data.close;
    const ma50 = this.calculateMA(data, 50);
    const ma200 = this.calculateMA(data, 200);

    if (price > ma50 && price > ma200 && ma50 > ma200) return 'Risk-On';
    if (price < ma50 && price < ma200 && ma50 < ma200) return 'Risk-Off';
    return 'Neutral';
  },

  calculateVolatilityRegime(data, period) {
    const volatility = this.calculateVolatility(data, period);
    const avgVolatility = 15; // Baseline volatility

    if (volatility > avgVolatility * 1.5) return 'High';
    if (volatility < avgVolatility * 0.5) return 'Low';
    return 'Normal';
  },

  calculateMomentumRegime(data, period) {
    const rsi = this.calculateRSI(data, period);
    const macd = this.calculateMACD(data);

    if (rsi > 70 && macd.histogram > 0) return 'Strong';
    if (rsi < 30 && macd.histogram < 0) return 'Weak';
    return 'Neutral';
  },

  calculateMA(data, period) {
    // Simple moving average calculation
    return data.close;  // Placeholder - implement actual MA calculation
  },

  calculateVolatility(data, period) {
    // Historical volatility calculation
    return 15;  // Placeholder - implement actual volatility calculation
  },

  calculateRSI(data, period) {
    // RSI calculation
    return 50;  // Placeholder - implement actual RSI calculation
  },

  calculateMACD(data) {
    // MACD calculation
    return {
      line: 0,
      signal: 0,
      histogram: 0
    };  // Placeholder - implement actual MACD calculation
  },

  getPreviousRegimes() {
    return cache.get('previous_regimes') || {};
  },

  detectRegimeChanges(current, previous) {
    const changes = {};
    
    for (const period of Object.keys(current)) {
      if (!previous[period]) continue;

      const currentRegime = current[period];
      const previousRegime = previous[period];

      changes[period] = {
        riskRegime: currentRegime.riskRegime !== previousRegime.riskRegime ? {
          from: previousRegime.riskRegime,
          to: currentRegime.riskRegime
        } : null,
        volatilityRegime: currentRegime.volatilityRegime !== previousRegime.volatilityRegime ? {
          from: previousRegime.volatilityRegime,
          to: currentRegime.volatilityRegime
        } : null,
        momentumRegime: currentRegime.momentumRegime !== previousRegime.momentumRegime ? {
          from: previousRegime.momentumRegime,
          to: currentRegime.momentumRegime
        } : null
      };
    }

    return changes;
  },

  generateRegimeAlerts(changes) {
    const alerts = [];

    for (const [period, regimeChanges] of Object.entries(changes)) {
      if (regimeChanges.riskRegime) {
        alerts.push({
          period: parseInt(period),
          type: 'risk_regime',
          severity: regimeChanges.riskRegime.to === 'Risk-Off' ? 'high' : 'medium',
          from: regimeChanges.riskRegime.from,
          to: regimeChanges.riskRegime.to
        });
      }

      if (regimeChanges.volatilityRegime) {
        alerts.push({
          period: parseInt(period),
          type: 'volatility_regime',
          severity: regimeChanges.volatilityRegime.to === 'High' ? 'high' : 'medium',
          from: regimeChanges.volatilityRegime.from,
          to: regimeChanges.volatilityRegime.to
        });
      }

      if (regimeChanges.momentumRegime) {
        alerts.push({
          period: parseInt(period),
          type: 'momentum_regime',
          severity: regimeChanges.momentumRegime.to === 'Weak' ? 'high' : 'medium',
          from: regimeChanges.momentumRegime.from,
          to: regimeChanges.momentumRegime.to
        });
      }
    }

    return alerts;
  },

  async monitorCorrelations() {
    const cacheKey = 'correlation_monitoring';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const marketData = await marketService.getData();
      const current = this.calculateCorrelations(marketData);
      const previous = this.getPreviousCorrelations();
      const breakdowns = this.detectCorrelationBreakdowns(current, previous);
      const alerts = this.generateCorrelationAlerts(breakdowns);

      const result = {
        current,
        previous,
        breakdowns,
        alerts
      };

      cache.set('previous_correlations', current);
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error monitoring correlations:', error);
      return this.getDefaultCorrelationData();
    }
  },

  calculateCorrelations(marketData) {
    // Placeholder correlation calculation
    return {};
  },

  getPreviousCorrelations() {
    return cache.get('previous_correlations') || {};
  },

  detectCorrelationBreakdowns(current, previous) {
    // Placeholder breakdown detection
    return [];
  },

  generateCorrelationAlerts(breakdowns) {
    // Placeholder alert generation
    return [];
  },

  getDefaultCorrelationData() {
    return {
      current: {},
      previous: {},
      breakdowns: [],
      alerts: []
    };
  },

  async monitorRiskConditions() {
    const cacheKey = 'risk_monitoring';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const marketData = await marketService.getData();
      const current = this.calculateRiskConditions(marketData);
      const previous = this.getPreviousRiskConditions();
      const changes = this.detectRiskChanges(current, previous);
      const alerts = this.generateRiskAlerts(changes);

      const result = {
        current,
        previous,
        changes,
        alerts
      };

      cache.set('previous_risk_conditions', current);
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error monitoring risk conditions:', error);
      return this.getDefaultRiskData();
    }
  },

  calculateRiskConditions(marketData) {
    return {
      level: 'Moderate',
      trend: 'Stable'
    };
  },

  getPreviousRiskConditions() {
    return cache.get('previous_risk_conditions') || {};
  },

  detectRiskChanges(current, previous) {
    return {
      level: current.level !== previous.level ? {
        from: previous.level,
        to: current.level,
        changed: true
      } : null,
      trend: current.trend !== previous.trend ? {
        from: previous.trend,
        to: current.trend,
        changed: true
      } : null
    };
  },

  generateRiskAlerts(changes) {
    const alerts = [];

    if (changes.level?.changed) {
      alerts.push({
        type: 'risk_level',
        severity: changes.level.to === 'High' ? 'high' : 'medium',
        from: changes.level.from,
        to: changes.level.to
      });
    }

    if (changes.trend?.changed) {
      alerts.push({
        type: 'risk_trend',
        severity: changes.trend.to === 'Deteriorating' ? 'high' : 'medium',
        from: changes.trend.from,
        to: changes.trend.to
      });
    }

    return alerts;
  },

  getDefaultRiskData() {
    return {
      current: {
        level: 'Moderate',
        trend: 'Stable'
      },
      previous: {},
      changes: {},
      alerts: []
    };
  }
};

export default marketMonitorService;
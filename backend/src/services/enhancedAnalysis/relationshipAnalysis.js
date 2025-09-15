// Enhanced Relationship Analysis Service
// Provides advanced analysis for macro relationships and correlations

class RelationshipAnalysis {
  constructor() {
    this.correlationCache = new Map();
    this.lastUpdate = null;
  }

  /**
   * Enhance macro data with relationship analysis
   * @param {Object} macroData - Raw macro data from routes
   * @returns {Object} Enhanced macro data with analysis
   */
  enhanceMacroData(macroData) {
    try {
      const enhanced = JSON.parse(JSON.stringify(macroData)); // Deep copy
      
      for (const [groupKey, groupData] of Object.entries(enhanced)) {
        if (groupData.performance && groupData.performance.length > 0) {
          // Add correlation analysis
          enhanced[groupKey].correlationMatrix = this.calculateCorrelationMatrix(groupData);
          
          // Add trend analysis
          enhanced[groupKey].trendAnalysis = this.calculateTrendAnalysis(groupData);
          
          // Add volatility analysis
          enhanced[groupKey].volatilityAnalysis = this.calculateVolatilityAnalysis(groupData);
          
          // Add relationship strength
          enhanced[groupKey].relationshipStrength = this.calculateRelationshipStrength(groupData);
          
          // Add enhanced insights
          enhanced[groupKey].insights = this.generateInsights(groupData, groupKey);
        }
      }
      
      return enhanced;
    } catch (error) {
      console.error('Error enhancing macro data:', error);
      // Return original data if enhancement fails
      return macroData;
    }
  }

  /**
   * Calculate correlation matrix for symbols in a group
   * @param {Object} groupData - Group data with performance array
   * @returns {Object} Correlation matrix
   */
  calculateCorrelationMatrix(groupData) {
    try {
      const symbols = groupData.symbols || [];
      const performance = groupData.performance || [];
      
      if (symbols.length < 2 || performance.length < 10) {
        return {};
      }

      const correlations = {};
      
      for (let i = 0; i < symbols.length; i++) {
        for (let j = i + 1; j < symbols.length; j++) {
          const symbol1 = symbols[i];
          const symbol2 = symbols[j];
          const key = `${symbol1}_${symbol2}`;
          
          const correlation = this.calculateCorrelation(
            performance.map(p => p[`pct_${symbol1}`]).filter(v => v !== undefined),
            performance.map(p => p[`pct_${symbol2}`]).filter(v => v !== undefined)
          );
          
          correlations[key] = Number(correlation.toFixed(3));
        }
      }
      
      return correlations;
    } catch (error) {
      console.error('Error calculating correlation matrix:', error);
      return {};
    }
  }

  /**
   * Calculate Pearson correlation coefficient
   * @param {Array} x - First data series
   * @param {Array} y - Second data series  
   * @returns {number} Correlation coefficient (-1 to 1)
   */
  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length < 3) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate trend analysis for the group
   * @param {Object} groupData - Group data
   * @returns {Object} Trend analysis
   */
  calculateTrendAnalysis(groupData) {
    try {
      const performance = groupData.performance || [];
      if (performance.length < 5) return {};

      const trends = {};
      const recentData = performance.slice(-30); // Last 30 data points
      
      groupData.symbols.forEach(symbol => {
        const pctKey = `pct_${symbol}`;
        const values = recentData
          .map(p => p[pctKey])
          .filter(v => v !== undefined);
          
        if (values.length >= 5) {
          const slope = this.calculateSlope(values);
          const direction = slope > 0.1 ? 'uptrend' : slope < -0.1 ? 'downtrend' : 'sideways';
          const strength = Math.abs(slope) > 0.5 ? 'strong' : Math.abs(slope) > 0.2 ? 'moderate' : 'weak';
          
          trends[symbol] = {
            direction,
            strength,
            slope: Number(slope.toFixed(4))
          };
        }
      });
      
      return trends;
    } catch (error) {
      console.error('Error calculating trend analysis:', error);
      return {};
    }
  }

  /**
   * Calculate simple linear slope
   * @param {Array} values - Data values
   * @returns {number} Slope
   */
  calculateSlope(values) {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Calculate volatility analysis
   * @param {Object} groupData - Group data
   * @returns {Object} Volatility analysis
   */
  calculateVolatilityAnalysis(groupData) {
    try {
      const performance = groupData.performance || [];
      if (performance.length < 10) return {};

      const volatility = {};
      
      groupData.symbols.forEach(symbol => {
        const pctKey = `pct_${symbol}`;
        const values = performance
          .map(p => p[pctKey])
          .filter(v => v !== undefined);
          
        if (values.length >= 10) {
          const returns = [];
          for (let i = 1; i < values.length; i++) {
            returns.push(values[i] - values[i-1]);
          }
          
          const stdDev = this.calculateStandardDeviation(returns);
          const level = stdDev > 2 ? 'high' : stdDev > 1 ? 'moderate' : 'low';
          
          volatility[symbol] = {
            standardDeviation: Number(stdDev.toFixed(3)),
            level,
            annualized: Number((stdDev * Math.sqrt(252)).toFixed(3))
          };
        }
      });
      
      return volatility;
    } catch (error) {
      console.error('Error calculating volatility analysis:', error);
      return {};
    }
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Data values
   * @returns {number} Standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => (value - mean) ** 2);
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Calculate relationship strength between symbols
   * @param {Object} groupData - Group data
   * @returns {Object} Relationship strength analysis
   */
  calculateRelationshipStrength(groupData) {
    try {
      const correlations = this.calculateCorrelationMatrix(groupData);
      const relationships = {};
      
      for (const [pair, correlation] of Object.entries(correlations)) {
        const absCorr = Math.abs(correlation);
        const strength = absCorr > 0.7 ? 'strong' : absCorr > 0.4 ? 'moderate' : 'weak';
        const direction = correlation > 0 ? 'positive' : 'negative';
        
        relationships[pair] = {
          correlation,
          strength,
          direction,
          significance: absCorr > 0.5 ? 'significant' : 'weak'
        };
      }
      
      return relationships;
    } catch (error) {
      console.error('Error calculating relationship strength:', error);
      return {};
    }
  }

  /**
   * Generate insights based on analysis
   * @param {Object} groupData - Group data
   * @param {string} groupKey - Group identifier
   * @returns {Array} Array of insights
   */
  generateInsights(groupData, groupKey) {
    try {
      const insights = [];
      const trends = this.calculateTrendAnalysis(groupData);
      const correlations = this.calculateCorrelationMatrix(groupData);
      
      // Trend insights
      const uptrends = Object.entries(trends).filter(([_, data]) => data.direction === 'uptrend').length;
      const downtrends = Object.entries(trends).filter(([_, data]) => data.direction === 'downtrend').length;
      
      if (uptrends > downtrends) {
        insights.push({
          type: 'trend',
          message: `${groupKey} group showing broad upward momentum`,
          importance: 'medium'
        });
      } else if (downtrends > uptrends) {
        insights.push({
          type: 'trend', 
          message: `${groupKey} group under pressure with downward trends`,
          importance: 'medium'
        });
      }
      
      // Correlation insights
      const strongCorrelations = Object.entries(correlations).filter(([_, corr]) => Math.abs(corr) > 0.7);
      if (strongCorrelations.length > 0) {
        insights.push({
          type: 'correlation',
          message: `Strong relationships detected in ${groupKey} - high correlation environment`,
          importance: 'high'
        });
      }
      
      // Group-specific insights
      if (groupKey === 'yields') {
        const flatCurve = Object.values(correlations).some(corr => corr > 0.9);
        if (flatCurve) {
          insights.push({
            type: 'yield_curve',
            message: 'Yield curve showing signs of flattening - monitor for inversion',
            importance: 'high'
          });
        }
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }
}

// Create singleton instance
const relationshipAnalysis = new RelationshipAnalysis();

export { relationshipAnalysis };
export default relationshipAnalysis;

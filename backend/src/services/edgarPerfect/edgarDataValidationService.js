// DATA VALIDATION SERVICE FOR PERFECT EDGAR
// Ensures data quality and consistency across all financial metrics

import NodeCache from 'node-cache';

class EdgarDataValidationService {
  constructor() {
    // Cache validation results for 30 minutes
    this.cache = new NodeCache({ stdTTL: 1800 });
    
    // Validation rules and thresholds
    this.validationRules = {
      // Value range checks
      ranges: {
        grossMargin: { min: -100, max: 100, unit: 'percentage' },
        netMargin: { min: -200, max: 100, unit: 'percentage' },
        roe: { min: -200, max: 200, unit: 'percentage' },
        roa: { min: -100, max: 100, unit: 'percentage' },
        debtToEquity: { min: 0, max: 50, unit: 'ratio' },
        currentRatio: { min: 0.1, max: 10, unit: 'ratio' }
      },
      
      // Logical relationship checks
      relationships: [
        {
          name: 'Revenue > Cost of Revenue',
          check: (data) => {
            if (!data.revenue || !data.costOfRevenue) return null;
            return data.revenue.value > data.costOfRevenue.value;
          },
          severity: 'critical'
        },
        {
          name: 'Gross Profit = Revenue - Cost of Revenue',
          check: (data) => {
            if (!data.revenue || !data.costOfRevenue || !data.grossProfit) return null;
            const calculated = data.revenue.value - data.costOfRevenue.value;
            const reported = data.grossProfit.value;
            const tolerance = Math.abs(calculated) * 0.01; // 1% tolerance
            return Math.abs(calculated - reported) <= tolerance;
          },
          severity: 'warning'
        },
        {
          name: 'Assets = Liabilities + Equity',
          check: (data) => {
            if (!data.totalAssets || !data.totalLiabilities || !data.shareholdersEquity) return null;
            const calculated = data.totalLiabilities.value + data.shareholdersEquity.value;
            const reported = data.totalAssets.value;
            const tolerance = Math.abs(reported) * 0.05; // 5% tolerance
            return Math.abs(calculated - reported) <= tolerance;
          },
          severity: 'critical'
        },
        {
          name: 'Free Cash Flow = Operating Cash Flow - CapEx',
          check: (data) => {
            if (!data.operatingCashFlow || !data.capitalExpenditures || !data.freeCashFlow) return null;
            const calculated = data.operatingCashFlow.value - Math.abs(data.capitalExpenditures.value);
            const reported = data.freeCashFlow.value;
            const tolerance = Math.abs(calculated) * 0.01; // 1% tolerance
            return Math.abs(calculated - reported) <= tolerance;
          },
          severity: 'warning'
        }
      ],
      
      // Industry-specific validations
      industryChecks: {
        technology: {
          expectedMargins: { gross: [60, 90], net: [15, 35] },
          keyMetrics: ['revenue', 'grossMargin', 'freeCashFlow', 'roe']
        },
        financial: {
          expectedMargins: { net: [10, 30], roe: [8, 20] },
          keyMetrics: ['netIncome', 'roe', 'totalAssets', 'shareholdersEquity']
        },
        retail: {
          expectedMargins: { gross: [20, 50], net: [2, 10] },
          keyMetrics: ['revenue', 'grossMargin', 'operatingCashFlow']
        },
        energy: {
          expectedMargins: { gross: [30, 70], net: [-10, 20] },
          keyMetrics: ['revenue', 'operatingCashFlow', 'capitalExpenditures']
        }
      }
    };
    
    // Historical comparison thresholds
    this.anomalyThresholds = {
      quarterOverQuarter: {
        revenue: 0.5, // 50% change is anomalous
        netIncome: 1.0, // 100% change is anomalous
        operatingCashFlow: 0.75
      },
      yearOverYear: {
        revenue: 1.0,
        netIncome: 2.0,
        operatingCashFlow: 1.5
      }
    };
  }

  // Main validation function
  async validateFinancialData(data, options = {}) {
    const cacheKey = `validation_${data.ticker}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !options.forceValidation) return cached;

    console.log(`🔍 Validating financial data for ${data.ticker}...`);
    
    const validation = {
      ticker: data.ticker,
      timestamp: new Date().toISOString(),
      status: 'valid',
      score: 100,
      issues: [],
      warnings: [],
      checks: {
        ranges: [],
        relationships: [],
        completeness: [],
        anomalies: []
      }
    };

    // 1. Check data completeness
    const completenessCheck = this.checkCompleteness(data.financials);
    validation.checks.completeness = completenessCheck.checks;
    if (completenessCheck.issues.length > 0) {
      validation.issues.push(...completenessCheck.issues);
      validation.score -= completenessCheck.issues.length * 5;
    }

    // 2. Validate value ranges
    const rangeCheck = this.checkValueRanges(data.financials);
    validation.checks.ranges = rangeCheck.checks;
    if (rangeCheck.issues.length > 0) {
      validation.warnings.push(...rangeCheck.issues);
      validation.score -= rangeCheck.issues.length * 3;
    }

    // 3. Check logical relationships
    const relationshipCheck = this.checkRelationships(data.financials);
    validation.checks.relationships = relationshipCheck.checks;
    relationshipCheck.issues.forEach(issue => {
      if (issue.severity === 'critical') {
        validation.issues.push(issue.message);
        validation.score -= 10;
      } else {
        validation.warnings.push(issue.message);
        validation.score -= 5;
      }
    });

    // 4. Check for anomalies (if historical data provided)
    if (options.historicalData) {
      const anomalyCheck = this.checkAnomalies(data.financials, options.historicalData);
      validation.checks.anomalies = anomalyCheck.checks;
      if (anomalyCheck.issues.length > 0) {
        validation.warnings.push(...anomalyCheck.issues);
        validation.score -= anomalyCheck.issues.length * 2;
      }
    }

    // 5. Industry-specific validation (if industry provided)
    if (options.industry) {
      const industryCheck = this.checkIndustrySpecific(data.financials, options.industry);
      if (industryCheck.issues.length > 0) {
        validation.warnings.push(...industryCheck.issues);
        validation.score -= industryCheck.issues.length * 2;
      }
    }

    // Determine final status
    validation.score = Math.max(0, validation.score);
    if (validation.score >= 90) {
      validation.status = 'excellent';
    } else if (validation.score >= 80) {
      validation.status = 'good';
    } else if (validation.score >= 70) {
      validation.status = 'fair';
    } else if (validation.score >= 60) {
      validation.status = 'poor';
    } else {
      validation.status = 'critical';
    }

    this.cache.set(cacheKey, validation);
    return validation;
  }

  // Check data completeness
  checkCompleteness(financials) {
    const requiredFields = [
      'revenue', 'netIncome', 'operatingCashFlow',
      'totalAssets', 'totalLiabilities', 'shareholdersEquity'
    ];
    
    const optionalButImportant = [
      'costOfRevenue', 'grossProfit', 'operatingIncome',
      'capitalExpenditures', 'freeCashFlow'
    ];

    const checks = [];
    const issues = [];

    // Check required fields
    requiredFields.forEach(field => {
      const exists = financials[field] && financials[field].value !== undefined;
      checks.push({
        field,
        type: 'required',
        exists,
        message: exists ? 'Present' : 'Missing required field'
      });
      
      if (!exists) {
        issues.push(`Missing required field: ${field}`);
      }
    });

    // Check optional fields
    optionalButImportant.forEach(field => {
      const exists = financials[field] && financials[field].value !== undefined;
      checks.push({
        field,
        type: 'optional',
        exists,
        message: exists ? 'Present' : 'Missing optional field'
      });
    });

    return { checks, issues };
  }

  // Check value ranges
  checkValueRanges(financials) {
    const checks = [];
    const issues = [];

    Object.entries(this.validationRules.ranges).forEach(([metric, rule]) => {
      if (financials[metric] && financials[metric].value !== undefined) {
        const value = financials[metric].value;
        const inRange = value >= rule.min && value <= rule.max;
        
        checks.push({
          metric,
          value,
          range: `${rule.min} to ${rule.max}`,
          inRange,
          unit: rule.unit
        });

        if (!inRange) {
          issues.push(`${metric} value ${value} is outside expected range [${rule.min}, ${rule.max}]`);
        }
      }
    });

    return { checks, issues };
  }

  // Check logical relationships
  checkRelationships(financials) {
    const checks = [];
    const issues = [];

    this.validationRules.relationships.forEach(rule => {
      const result = rule.check(financials);
      
      if (result !== null) {
        checks.push({
          name: rule.name,
          passed: result,
          severity: rule.severity
        });

        if (!result) {
          issues.push({
            message: `Failed validation: ${rule.name}`,
            severity: rule.severity
          });
        }
      }
    });

    return { checks, issues };
  }

  // Check for anomalies
  checkAnomalies(currentData, historicalData) {
    const checks = [];
    const issues = [];

    // Compare with previous period
    if (historicalData.previousQuarter) {
      Object.entries(this.anomalyThresholds.quarterOverQuarter).forEach(([metric, threshold]) => {
        if (currentData[metric] && historicalData.previousQuarter[metric]) {
          const current = currentData[metric].value;
          const previous = historicalData.previousQuarter[metric].value;
          const change = Math.abs((current - previous) / previous);
          
          checks.push({
            metric,
            period: 'QoQ',
            change: change * 100,
            threshold: threshold * 100,
            anomalous: change > threshold
          });

          if (change > threshold) {
            issues.push(`${metric} changed by ${(change * 100).toFixed(1)}% QoQ (threshold: ${(threshold * 100)}%)`);
          }
        }
      });
    }

    return { checks, issues };
  }

  // Industry-specific validation
  checkIndustrySpecific(financials, industry) {
    const issues = [];
    const industryRules = this.validationRules.industryChecks[industry.toLowerCase()];
    
    if (!industryRules) return { issues };

    // Check expected margins
    if (industryRules.expectedMargins) {
      Object.entries(industryRules.expectedMargins).forEach(([margin, [min, max]]) => {
        const metricName = margin + 'Margin';
        if (financials[metricName]) {
          const value = financials[metricName].value;
          if (value < min || value > max) {
            issues.push(`${metricName} (${value.toFixed(1)}%) outside typical range for ${industry} [${min}%-${max}%]`);
          }
        }
      });
    }

    // Check key metrics presence
    industryRules.keyMetrics.forEach(metric => {
      if (!financials[metric]) {
        issues.push(`Missing key metric for ${industry}: ${metric}`);
      }
    });

    return { issues };
  }

  // Generate validation report
  generateValidationReport(validationResult) {
    const report = {
      summary: {
        ticker: validationResult.ticker,
        status: validationResult.status,
        score: validationResult.score,
        timestamp: validationResult.timestamp
      },
      details: {
        criticalIssues: validationResult.issues,
        warnings: validationResult.warnings,
        totalChecks: Object.values(validationResult.checks).flat().length,
        passedChecks: Object.values(validationResult.checks).flat().filter(c => c.passed || c.exists || c.inRange).length
      },
      recommendations: []
    };

    // Generate recommendations
    if (validationResult.issues.length > 0) {
      report.recommendations.push('Address critical data quality issues before using for analysis');
    }
    
    if (validationResult.score < 80) {
      report.recommendations.push('Consider re-extracting data or using alternative sources');
    }

    if (validationResult.warnings.length > 5) {
      report.recommendations.push('Review warnings to improve data accuracy');
    }

    return report;
  }

  // Validate batch of companies
  async validateBatch(companies, options = {}) {
    const results = [];
    
    for (const company of companies) {
      try {
        const validation = await this.validateFinancialData(company, options);
        results.push({
          ticker: company.ticker,
          validation,
          report: this.generateValidationReport(validation)
        });
      } catch (error) {
        results.push({
          ticker: company.ticker,
          error: error.message
        });
      }
    }

    return {
      results,
      summary: {
        total: results.length,
        excellent: results.filter(r => r.validation?.status === 'excellent').length,
        good: results.filter(r => r.validation?.status === 'good').length,
        fair: results.filter(r => r.validation?.status === 'fair').length,
        poor: results.filter(r => r.validation?.status === 'poor').length,
        critical: results.filter(r => r.validation?.status === 'critical').length,
        errors: results.filter(r => r.error).length
      }
    };
  }
}

export default new EdgarDataValidationService();

  /**
   * REDESIGNED: Investment-oriented company score calculation
   */
  async calculateCompanyScoresEnhanced(companyData) {
    try {
      const scores = {
        symbol: companyData.symbol,
        name: companyData.name,
        sector: companyData.sector,
        shortTermScore: 50,
        longTermScore: 50,
        dataQuality: companyData.dataQuality,
        components: {
          technical: 50,
          momentum: 50,
          valuation: 50,
          fundamental: 50
        }
      };
      
      // Technical Analysis (SHORT-TERM MOMENTUM) - Reward positive trends
      if (companyData.historical && Array.isArray(companyData.historical) && companyData.historical.length >= 20) {
        try {
          const technicalScore = await Promise.race([
            this.calculateInvestmentTechnicalScore(companyData.historical),
            new Promise(resolve => setTimeout(() => resolve(50), this.config.pythonTimeout))
          ]);
          scores.components.technical = technicalScore;
        } catch (error) {
          console.warn(`Technical analysis failed for ${companyData.symbol}: ${error.message}`);
        }
      }
      
      // Momentum Analysis (SHORT-TERM EARNINGS) - Reward growth acceleration
      if (companyData.growth || companyData.earnings) {
        scores.components.momentum = this.calculateInvestmentMomentumScore(companyData);
      }
      
      // Valuation Analysis (LONG-TERM) - Penalize expensive valuations
      if (companyData.ratios || companyData.keyMetrics) {
        scores.components.valuation = this.calculateInvestmentValuationScore(companyData);
      }
      
      // Fundamental Analysis (LONG-TERM) - Reward quality
      if (companyData.ratios) {
        scores.components.fundamental = this.calculateInvestmentFundamentalScore(companyData);
      }
      
      // Calculate composite scores with INVESTMENT LOGIC
      scores.shortTermScore = Math.round(
        (scores.components.technical * 0.6) + (scores.components.momentum * 0.4)
      );
      
      scores.longTermScore = Math.round(
        (scores.components.valuation * 0.6) + (scores.components.fundamental * 0.4)
      );
      
      return scores;
      
    } catch (error) {
      console.error(`❌ Score calculation failed for ${companyData.symbol}:`, error);
      return {
        symbol: companyData.symbol,
        shortTermScore: 50,
        longTermScore: 50,
        error: error.message
      };
    }
  }

  /**
   * REDESIGNED: Investment-oriented technical scoring
   * Strong uptrends = HIGH score (good for momentum)
   */
  calculateInvestmentTechnicalScore(historicalData) {
    let score = 50;
    
    try {
      if (historicalData.length < 20) return 50;
      
      const prices = historicalData.map(d => d.close).slice(-50); // Last 50 days
      const currentPrice = prices[prices.length - 1];
      
      // 1. Price trend analysis (40% weight)
      const ma20 = prices.slice(-20).reduce((sum, p) => sum + p, 0) / 20;
      const ma50 = prices.length >= 50 ? prices.reduce((sum, p) => sum + p, 0) / 50 : ma20;
      
      if (currentPrice > ma20 && ma20 > ma50) {
        score += 25; // Strong uptrend = EXCELLENT for momentum
      } else if (currentPrice > ma20) {
        score += 15; // Short-term uptrend = GOOD
      } else if (currentPrice > ma50) {
        score += 5; // Long-term uptrend = OK
      } else {
        score -= 20; // Downtrend = BAD for momentum
      }
      
      // 2. Price momentum (30% weight)
      const weekAgo = prices[prices.length - 6] || currentPrice;
      const monthAgo = prices[prices.length - 21] || currentPrice;
      
      const weekReturn = ((currentPrice - weekAgo) / weekAgo) * 100;
      const monthReturn = ((currentPrice - monthAgo) / monthAgo) * 100;
      
      if (weekReturn > 5) score += 20; // Strong weekly momentum
      else if (weekReturn > 2) score += 10; // Good weekly momentum
      else if (weekReturn < -5) score -= 15; // Weak momentum
      
      if (monthReturn > 10) score += 15; // Strong monthly momentum
      else if (monthReturn > 5) score += 8; // Good monthly momentum
      else if (monthReturn < -10) score -= 10; // Poor momentum
      
      // 3. Relative strength vs recent highs (30% weight)
      const recentHigh = Math.max(...prices);
      const percentFromHigh = ((currentPrice - recentHigh) / recentHigh) * 100;
      
      if (percentFromHigh > -2) {
        score += 20; // Near highs = STRONG momentum
      } else if (percentFromHigh > -5) {
        score += 10; // Close to highs = GOOD momentum
      } else if (percentFromHigh < -20) {
        score -= 15; // Far from highs = WEAK momentum
      }
      
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      console.error('❌ Investment technical score calculation failed:', error);
      return 50;
    }
  }

  /**
   * REDESIGNED: Investment momentum scoring 
   * Growth acceleration = HIGH score
   */
  calculateInvestmentMomentumScore(companyData) {
    let score = 50;
    
    try {
      if (companyData.growth && companyData.growth.length > 0) {
        const growth = companyData.growth[0];
        
        // Revenue growth momentum (40% weight)
        if (growth.revenueGrowth > 0.20) score += 25; // Excellent growth
        else if (growth.revenueGrowth > 0.10) score += 15; // Good growth  
        else if (growth.revenueGrowth > 0.05) score += 8; // Moderate growth
        else if (growth.revenueGrowth < -0.05) score -= 20; // Declining revenue
        
        // Earnings growth momentum (40% weight) 
        if (growth.netIncomeGrowth > 0.25) score += 25; // Excellent earnings
        else if (growth.netIncomeGrowth > 0.15) score += 15; // Good earnings
        else if (growth.netIncomeGrowth > 0.10) score += 8; // Moderate earnings
        else if (growth.netIncomeGrowth < -0.10) score -= 20; // Declining earnings
        
        // Cash flow growth (20% weight)
        if (growth.freeCashFlowGrowth > 0.20) score += 15; // Excellent FCF
        else if (growth.freeCashFlowGrowth > 0.10) score += 8; // Good FCF
        else if (growth.freeCashFlowGrowth < -0.15) score -= 10; // Poor FCF
      }
      
      // Recent price momentum boost
      if (companyData.quote && companyData.quote.length > 0) {
        const quote = companyData.quote[0];
        
        if (quote.changesPercentage > 10) score += 15; // Strong recent move
        else if (quote.changesPercentage > 5) score += 8; // Good recent move
        else if (quote.changesPercentage < -10) score -= 15; // Weak recent move
      }
      
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      console.error('❌ Investment momentum score calculation failed:', error);
      return 50;
    }
  }

  /**
   * REDESIGNED: Investment valuation scoring
   * Expensive valuations = LOW score (poor for long-term)
   */
  calculateInvestmentValuationScore(companyData) {
    let score = 50;
    
    try {
      let ratioData = null;
      
      if (companyData.ratios && companyData.ratios.length > 0) {
        ratioData = companyData.ratios[0];
      } else if (companyData.keyMetrics && companyData.keyMetrics.length > 0) {
        ratioData = companyData.keyMetrics[0];
      }
      
      if (!ratioData) return 50;
      
      // P/E Ratio analysis (30% weight) - PENALIZE expensive P/E
      if (ratioData.priceEarningsRatio && ratioData.priceEarningsRatio > 0) {
        const pe = ratioData.priceEarningsRatio;
        if (pe < 12) score += 20; // Cheap = EXCELLENT for long-term
        else if (pe < 18) score += 10; // Reasonable = GOOD
        else if (pe < 25) score -= 5; // Slightly expensive = OK
        else if (pe < 35) score -= 15; // Expensive = BAD
        else score -= 25; // Very expensive = TERRIBLE
      }
      
      // P/B Ratio analysis (25% weight) - PENALIZE high P/B
      if (ratioData.priceToBookRatio && ratioData.priceToBookRatio > 0) {
        const pb = ratioData.priceToBookRatio;
        if (pb < 1.5) score += 15; // Cheap book value = GOOD
        else if (pb < 3) score += 5; // Reasonable = OK  
        else if (pb < 5) score -= 10; // Expensive = BAD
        else score -= 20; // Very expensive = TERRIBLE
      }
      
      // EV/EBITDA analysis (25% weight) - PENALIZE high multiples
      if (ratioData.enterpriseValueMultiple && ratioData.enterpriseValueMultiple > 0) {
        const evEbitda = ratioData.enterpriseValueMultiple;
        if (evEbitda < 8) score += 15; // Cheap = EXCELLENT
        else if (evEbitda < 12) score += 8; // Reasonable = GOOD
        else if (evEbitda < 18) score -= 5; // Expensive = BAD
        else score -= 15; // Very expensive = TERRIBLE
      }
      
      // P/S Ratio analysis (20% weight) - PENALIZE high P/S
      if (ratioData.priceToSalesRatio && ratioData.priceToSalesRatio > 0) {
        const ps = ratioData.priceToSalesRatio;
        if (ps < 1.5) score += 10; // Cheap sales multiple = GOOD
        else if (ps < 3) score += 5; // Reasonable = OK
        else if (ps < 6) score -= 8; // Expensive = BAD
        else score -= 15; // Very expensive = TERRIBLE
      }
      
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      console.error('❌ Investment valuation score calculation failed:', error);
      return 50;
    }
  }

  /**
   * REDESIGNED: Investment fundamental scoring
   * High quality fundamentals = HIGH score
   */
  calculateInvestmentFundamentalScore(companyData) {
    let score = 50;
    
    try {
      if (!companyData.ratios || companyData.ratios.length === 0) return 50;
      
      const ratios = companyData.ratios[0];
      
      // Return on Equity (30% weight) - REWARD high ROE
      if (ratios.returnOnEquity && ratios.returnOnEquity > 0) {
        const roe = ratios.returnOnEquity;
        if (roe > 0.25) score += 25; // Excellent profitability
        else if (roe > 0.18) score += 18; // Very good profitability
        else if (roe > 0.12) score += 12; // Good profitability
        else if (roe > 0.08) score += 5; // Moderate profitability
        else score -= 10; // Poor profitability
      }
      
      // Debt management (25% weight) - REWARD low debt
      if (ratios.debtEquityRatio !== undefined && ratios.debtEquityRatio >= 0) {
        const de = ratios.debtEquityRatio;
        if (de < 0.2) score += 20; // Very low debt = EXCELLENT
        else if (de < 0.4) score += 15; // Low debt = VERY GOOD
        else if (de < 0.6) score += 10; // Moderate debt = GOOD
        else if (de < 1.0) score += 0; // Normal debt = OK
        else if (de < 2.0) score -= 10; // High debt = BAD
        else score -= 20; // Very high debt = TERRIBLE
      }
      
      // Liquidity (20% weight) - REWARD strong liquidity
      if (ratios.currentRatio && ratios.currentRatio > 0) {
        const cr = ratios.currentRatio;
        if (cr > 2.5) score += 15; // Excellent liquidity
        else if (cr > 2.0) score += 12; // Very good liquidity
        else if (cr > 1.5) score += 10; // Good liquidity
        else if (cr > 1.2) score += 5; // Adequate liquidity  
        else if (cr > 1.0) score -= 5; // Weak liquidity
        else score -= 15; // Poor liquidity
      }
      
      // Profitability margins (25% weight) - REWARD high margins
      if (ratios.netProfitMargin && ratios.netProfitMargin > 0) {
        const margin = ratios.netProfitMargin;
        if (margin > 0.20) score += 20; // Excellent margins
        else if (margin > 0.15) score += 15; // Very good margins
        else if (margin > 0.10) score += 10; // Good margins
        else if (margin > 0.05) score += 5; // Moderate margins
        else score -= 10; // Poor margins
      }
      
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      console.error('❌ Investment fundamental score calculation failed:', error);
      return 50;
    }
  }

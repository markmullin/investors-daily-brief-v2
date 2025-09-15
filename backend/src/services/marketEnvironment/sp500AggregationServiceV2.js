/**
 * S&P 500 Fundamentals Aggregation Service V2 - RATE LIMIT COMPLIANT
 * Collects ALL S&P 500 companies with proper rate limit handling
 * Automatically waits when rate limit is hit
 */

import fmpService from '../fmpService.js';
import redisService from '../redisService.js';
import { SP500_COMPONENTS } from '../../data/sp500Components.js';

class SP500AggregationServiceV2 {
  constructor() {
    this.cacheKey = 'market:sp500:fundamentals:v2';
    this.cacheTTL = 86400; // 24 hours
    this.lastRunKey = 'market:sp500:fundamentals:lastrun';
    this.progressKey = 'market:sp500:fundamentals:progress';
    this.requestCount = 0;
    this.requestsPerMinute = 450; // Stay under 500 limit
    this.requestStartTime = Date.now();
  }

  /**
   * Get latest aggregation or trigger new one if stale
   */
  async getLatestAggregation() {
    try {
      // Check cache first
      const cached = await redisService.get(this.cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Check if data is recent enough (less than 36 hours old)
        const dataAge = Date.now() - new Date(data.timestamp).getTime();
        const maxAge = 36 * 60 * 60 * 1000; // 36 hours
        
        if (dataAge < maxAge) {
          return data;
        }
      }

      return this.getDefaultMetrics();

    } catch (error) {
      console.error('❌ Error getting S&P 500 aggregation:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get default metrics when no data available
   */
  getDefaultMetrics() {
    return {
      marketPE: 21.5,
      peDistribution: {
        p10: 12,
        p25: 16,
        median: 20,
        p75: 25,
        p90: 32
      },
      earningsGrowth: 5.0,
      percentWithPositiveGrowth: 65,
      avgProfitMargin: 12.5,
      dataQuality: {
        status: 'INCOMPLETE',
        message: 'Run /api/market-env/aggregate for complete data',
        lastUpdate: null
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check and wait for rate limit if needed
   */
  async checkRateLimit() {
    this.requestCount++;
    
    // Check if we've hit our per-minute limit
    if (this.requestCount >= this.requestsPerMinute) {
      const elapsed = Date.now() - this.requestStartTime;
      const timeToWait = Math.max(0, 60000 - elapsed + 1000); // Wait until next minute + 1 second buffer
      
      if (timeToWait > 0) {
        console.log(`⏸️ Rate limit reached (${this.requestCount} requests). Waiting ${Math.ceil(timeToWait/1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, timeToWait));
        
        // Reset counters
        this.requestCount = 0;
        this.requestStartTime = Date.now();
        
        // Reset FMP circuit breaker if it's open
        if (fmpService.circuitBreaker && fmpService.circuitBreaker.state === 'OPEN') {
          console.log('🔄 Resetting FMP circuit breaker...');
          fmpService.circuitBreaker.state = 'CLOSED';
          fmpService.circuitBreaker.failureCount = 0;
        }
      }
    }
  }

  /**
   * Run complete aggregation with automatic rate limit handling
   */
  async runNightlyAggregation(forceRun = false) {
    console.log('🌙 Starting S&P 500 COMPLETE aggregation at', new Date().toISOString());
    console.log('🎯 Target: 100% coverage of all S&P 500 companies');
    
    try {
      // Check if we've run recently (unless forced)
      if (!forceRun) {
        const lastRun = await redisService.get(this.lastRunKey);
        if (lastRun) {
          const timeSinceLastRun = Date.now() - parseInt(lastRun);
          const minTimeBetweenRuns = 20 * 60 * 60 * 1000; // 20 hours
          
          if (timeSinceLastRun < minTimeBetweenRuns) {
            console.log('⏭️ Skipping - ran recently. Use force flag to override.');
            return await this.getLatestAggregation();
          }
        }
      }

      // Check for saved progress (resume capability)
      let startIndex = 0;
      let allResults = [];
      const savedProgress = await redisService.get(this.progressKey);
      
      if (savedProgress && !forceRun) {
        const progress = JSON.parse(savedProgress);
        startIndex = progress.lastIndex;
        allResults = progress.results || [];
        console.log(`📂 Resuming from company ${startIndex} with ${allResults.length} already collected`);
      }

      // Mark start of run
      await redisService.set(this.lastRunKey, Date.now().toString(), this.cacheTTL);

      // Get list of S&P 500 companies
      const companies = SP500_COMPONENTS;
      console.log(`📊 Processing ${companies.length} S&P 500 companies...`);

      // Process in smaller batches to avoid rate limits
      const batchSize = 10; // Smaller batches = better rate limit control
      let successCount = allResults.length;
      let errorCount = 0;
      let consecutiveErrors = 0;

      for (let i = startIndex; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, Math.min(i + batchSize, companies.length));
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(companies.length / batchSize);
        
        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} companies)...`);

        // Process batch with rate limit checking
        for (const symbol of batch) {
          await this.checkRateLimit();
          
          try {
            const result = await this.processCompany(symbol);
            if (result.success) {
              allResults.push(result.data);
              successCount++;
              consecutiveErrors = 0;
            } else {
              errorCount++;
              consecutiveErrors++;
              
              // If we hit rate limit, wait longer
              if (result.error && result.error.includes('rate limit')) {
                console.log('⚠️ Rate limit detected. Waiting 65 seconds for reset...');
                await new Promise(resolve => setTimeout(resolve, 65000));
                
                // Retry the failed company
                const retryResult = await this.processCompany(symbol);
                if (retryResult.success) {
                  allResults.push(retryResult.data);
                  successCount++;
                  errorCount--;
                  consecutiveErrors = 0;
                }
              }
            }
          } catch (error) {
            console.error(`Error processing ${symbol}:`, error.message);
            errorCount++;
            consecutiveErrors++;
          }
          
          // Emergency stop if too many consecutive errors
          if (consecutiveErrors > 20) {
            console.log('⚠️ Too many consecutive errors. Pausing for 2 minutes...');
            await new Promise(resolve => setTimeout(resolve, 120000));
            consecutiveErrors = 0;
            
            // Reset circuit breaker
            if (fmpService.circuitBreaker) {
              fmpService.circuitBreaker.state = 'CLOSED';
              fmpService.circuitBreaker.failureCount = 0;
            }
          }
        }

        // Save progress after each batch
        await redisService.set(this.progressKey, JSON.stringify({
          lastIndex: i + batchSize,
          results: allResults,
          timestamp: new Date().toISOString()
        }), 3600); // Keep progress for 1 hour

        // Progress update
        const percentComplete = ((successCount / companies.length) * 100).toFixed(1);
        console.log(`✅ Batch ${batchNum} complete. Progress: ${successCount}/${companies.length} (${percentComplete}%)`);
        
        // Small delay between batches
        if (i + batchSize < companies.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`📈 Data collection complete. Success: ${successCount}, Errors: ${errorCount}`);
      
      // Only proceed if we have at least 90% coverage
      if (successCount < companies.length * 0.9) {
        console.log(`⚠️ Insufficient coverage (${((successCount/companies.length)*100).toFixed(1)}%). Need at least 90%.`);
        console.log('💡 Run aggregation again to collect remaining companies.');
        
        // Still save partial results
        const partialMetrics = this.calculateAggregatedMetrics(allResults);
        partialMetrics.dataQuality = {
          companiesAnalyzed: successCount,
          totalCompanies: companies.length,
          completeness: ((successCount / companies.length) * 100).toFixed(1) + '%',
          errors: errorCount,
          status: 'PARTIAL',
          message: 'Incomplete data. Re-run aggregation for full coverage.'
        };
        partialMetrics.timestamp = new Date().toISOString();
        
        await redisService.set(this.cacheKey, JSON.stringify(partialMetrics), this.cacheTTL);
        return partialMetrics;
      }

      // Calculate aggregated metrics
      const aggregatedMetrics = this.calculateAggregatedMetrics(allResults);

      // Add metadata
      aggregatedMetrics.dataQuality = {
        companiesAnalyzed: successCount,
        totalCompanies: companies.length,
        completeness: ((successCount / companies.length) * 100).toFixed(1) + '%',
        errors: errorCount,
        status: successCount === companies.length ? 'COMPLETE' : 'GOOD'
      };
      aggregatedMetrics.timestamp = new Date().toISOString();

      // Cache the results
      await redisService.set(this.cacheKey, JSON.stringify(aggregatedMetrics), this.cacheTTL);
      
      // Clear progress since we're done
      await redisService.del(this.progressKey);

      console.log('✅ S&P 500 aggregation COMPLETE with', aggregatedMetrics.dataQuality.completeness, 'coverage');
      return aggregatedMetrics;

    } catch (error) {
      console.error('❌ Fatal error in S&P 500 aggregation:', error);
      throw error;
    }
  }

  /**
   * Process a single company with error handling
   */
  async processCompany(symbol) {
    try {
      // Skip problematic tickers
      if (symbol.includes('.') && symbol !== 'BRK.B' && symbol !== 'BF.B') {
        return { success: false, symbol, error: 'Skipped special ticker' };
      }

      // Get company data from FMP
      const quote = await fmpService.getQuote(symbol);
      
      if (!quote || !quote[0]) {
        return { success: false, symbol, error: 'No quote data' };
      }

      // Extract data from quote
      const data = {
        symbol,
        marketCap: quote[0].marketCap || 0,
        pe: quote[0].pe || null,
        eps: quote[0].eps || null,
        price: quote[0].price || 0,
        changesPercentage: quote[0].changesPercentage || 0,
        yearHigh: quote[0].yearHigh || null,
        yearLow: quote[0].yearLow || null,
        volume: quote[0].volume || 0,
        avgVolume: quote[0].avgVolume || 0
      };

      // Try to get profile for sector info (optional)
      if (fmpService.getCompanyProfile) {
        await this.checkRateLimit();
        try {
          const profile = await fmpService.getCompanyProfile(symbol);
          if (profile && profile[0]) {
            data.sector = profile[0].sector;
            data.industry = profile[0].industry;
            data.beta = profile[0].beta;
          }
        } catch (profileError) {
          // Profile is optional, continue without it
        }
      }

      return { success: true, data, symbol };

    } catch (error) {
      return { success: false, symbol, error: error.message };
    }
  }

  /**
   * Calculate aggregated metrics from company data
   * Uses PROPER S&P 500 methodology: Index P/E = Total Market Cap / Total Earnings
   */
  calculateAggregatedMetrics(companies) {
    // Filter out companies without valid data
    const validCompanies = companies.filter(c => 
      c.pe && 
      c.pe > 0 && 
      c.pe < 1000 && 
      c.marketCap && 
      c.marketCap > 0
    );
    
    if (validCompanies.length === 0) {
      return this.getDefaultMetrics();
    }

    // Calculate P/E distribution (individual company P/Es)
    const peValues = validCompanies.map(c => c.pe).sort((a, b) => a - b);
    const peDistribution = {
      p10: this.getPercentile(peValues, 10),
      p25: this.getPercentile(peValues, 25),
      median: this.getPercentile(peValues, 50),
      p75: this.getPercentile(peValues, 75),
      p90: this.getPercentile(peValues, 90)
    };

    // CORRECT S&P 500 P/E CALCULATION
    // Index P/E = Total Market Cap / Total Earnings
    // For each company: Earnings = Market Cap / P/E
    
    let totalMarketCap = 0;
    let totalEarnings = 0;
    
    validCompanies.forEach(company => {
      const marketCap = company.marketCap;
      const pe = company.pe;
      
      // Calculate company earnings from Market Cap and P/E
      // E = Market Cap / P/E
      const companyEarnings = marketCap / pe;
      
      totalMarketCap += marketCap;
      totalEarnings += companyEarnings;
    });
    
    // Index P/E = Total Market Cap / Total Earnings
    const indexPE = totalEarnings > 0 ? totalMarketCap / totalEarnings : 0;
    
    console.log(`📊 Index P/E Calculation:`);
    console.log(`   Total Market Cap: ${(totalMarketCap / 1e12).toFixed(2)}T`);
    console.log(`   Total Earnings: ${(totalEarnings / 1e9).toFixed(2)}B`);
    console.log(`   Index P/E: ${indexPE.toFixed(2)}`);
    console.log(`   Companies included: ${validCompanies.length}`);
    
    // For comparison, also calculate simple average (unweighted)
    const simpleAvgPE = peValues.reduce((sum, pe) => sum + pe, 0) / peValues.length;

    // Calculate earnings growth
    const companiesWithGrowth = validCompanies.filter(c => c.changesPercentage !== null);
    const avgGrowth = companiesWithGrowth.length > 0
      ? companiesWithGrowth.reduce((sum, c) => sum + c.changesPercentage, 0) / companiesWithGrowth.length
      : 5.0;

    const percentPositive = companiesWithGrowth.length > 0
      ? (companiesWithGrowth.filter(c => c.changesPercentage > 0).length / companiesWithGrowth.length) * 100
      : 50;

    // Calculate sector breakdown if we have sector data
    const sectorBreakdown = {};
    companies.forEach(c => {
      if (c.sector) {
        sectorBreakdown[c.sector] = (sectorBreakdown[c.sector] || 0) + 1;
      }
    });

    return {
      marketPE: parseFloat(indexPE.toFixed(2)),
      simpleAvgPE: parseFloat(simpleAvgPE.toFixed(2)),
      peDistribution,
      earningsGrowth: parseFloat(avgGrowth.toFixed(2)),
      percentWithPositiveGrowth: parseFloat(percentPositive.toFixed(1)),
      avgProfitMargin: 12.5, // Default as we can't get this from basic quotes
      companiesAnalyzed: validCompanies.length,
      sectorBreakdown,
      totalMarketCap: totalMarketCap
    };
  }

  /**
   * Calculate percentile value from sorted array
   */
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }
}

export default new SP500AggregationServiceV2();

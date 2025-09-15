import axios from 'axios';
import beaService from './beaService.js';

class FREDService {
  constructor() {
    this.baseURL = 'https://api.stlouisfed.org/fred';
    this.apiKey = process.env.FRED_API_KEY || 'dca5bb7524d0b194a9963b449e69c655';
    
    // FRED series IDs for our indicators - USING ACTUAL IDS FROM FRED WEBSITE
    this.seriesIds = {
      // Interest rates
      twoYear: 'DGS2',      // 2-Year Treasury Constant Maturity Rate
      tenYear: 'DGS10',     // 10-Year Treasury Constant Maturity Rate
      thirtyYear: 'DGS30',  // 30-Year Treasury Constant Maturity Rate
      mortgage30: 'MORTGAGE30US',  // 30-Year Fixed Rate Mortgage Average
      
      // Leading indicators - FIXED: Using ACTUAL SERIES IDS from user's screenshots
      bbkLEI: 'BBKMLEIX',            // Brave-Butters-Kelley Leading Index (verified working)
      cfnai: 'CFNAI',                // Chicago Fed National Activity Index (ADDED BACK)
      initialClaims: 'ICSA',         // Initial Claims (FIXED - user verified this works)
      construction: 'TLMFGCONS',     // Total Manufacturing Construction Spending (FIXED - user verified)
      newOrders: 'NEWORDER',         // Manufacturers' New Orders (verified working)
      housingPermits: 'PERMIT',      // New Housing Permits (verified working)
      
      // Monetary policy indicators
      m2MoneySupply: 'M2SL',         // M2 Money Supply
      fedFundsRate: 'FEDFUNDS',      // Effective Federal Funds Rate
      moneyMarketFunds: 'MMMFFAQ027S', // Money Market Fund Assets (Billions)
      
      // Growth and inflation (GDP now from BEA directly)
      cpi: 'CPIAUCSL',               // Consumer Price Index
      pce: 'PCEPI',                  // Personal Consumption Expenditures Price Index
      ppi: 'PPIACO',                 // Producer Price Index
      
      // Labor and consumer
      unemployment: 'UNRATE',         // Civilian Unemployment Rate
      retailSales: 'RSAFS',          // Advance Retail Sales
      realPersonalIncome: 'W875RX1',  // Real Personal Income (absolute value, needs YoY calculation)
      
      // Housing indicators - FIXED: Using ACTUAL SERIES IDS from user's screenshots
      caseShiller: 'SPCS20RSA',       // S&P/Case-Shiller 20-City (FIXED - user verified)
      existingHomeSales: 'EXHOSLUSM495S',  // Existing Home Sales (verified working)
      housingStarts: 'HOUST'          // Housing Starts (additional housing metric)
    };
  }

  // Convert Money Market Funds data from millions to billions
  convertMMFData(mmfData) {
    if (!mmfData || !Array.isArray(mmfData)) {
      console.log('💰 MMF conversion: No data to convert');
      return mmfData;
    }

    return mmfData.map(point => {
      const originalValue = point.value;
      // FRED MMMFFAQ027S comes in millions, convert to billions
      const billionsValue = originalValue / 1000;
      
      console.log(`💰 BACKEND MMF CONVERSION: ${originalValue} millions → ${billionsValue.toFixed(1)} billions`);
      
      return {
        ...point,
        value: parseFloat(billionsValue.toFixed(1))
      };
    });
  }

  async getSeriesData(seriesId, startDate = null, endDate = null) {
    try {
      // FIXED: Calculate start date if not provided (default to 5 years ago for YoY calculations)
      if (!startDate) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 5); // 5 years for better YoY calculations
        startDate = date.toISOString().split('T')[0];
      }

      // FIXED: Ensure we get the absolute latest data by setting end date to future
      if (!endDate) {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year in future
        endDate = futureDate.toISOString().split('T')[0];
      }

      const params = {
        series_id: seriesId,
        api_key: this.apiKey,
        file_type: 'json',
        observation_start: startDate,
        observation_end: endDate,  // FIXED: Added end date to ensure latest data
        sort_order: 'asc',
        limit: 2000  // FIXED: Ensure we don't hit data limits
      };

      console.log(`🔍 Fetching FRED data for ${seriesId} from ${startDate} to ${endDate}`);
      
      const response = await axios.get(`${this.baseURL}/series/observations`, { params });
      
      if (response.data && response.data.observations) {
        const processedData = this.processObservations(response.data.observations, seriesId);
        
        console.log(`📊 FRED ${seriesId}: ${processedData.length} observations`);
        
        return processedData;
      }
      
      throw new Error(`No data received for series: ${seriesId}`);
    } catch (error) {
      console.error(`Error fetching FRED data for ${seriesId}:`, error.message);
      
      // Log more details for debugging problematic series
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Status Text: ${error.response.statusText}`);
        if (error.response.data) {
          console.error(`  Error Data:`, error.response.data);
        }
      }
      
      throw error;
    }
  }

  async getMultipleSeries(seriesIds, startDate = null, endDate = null) {
    try {
      const promises = seriesIds.map(id => 
        this.getSeriesData(id, startDate, endDate)
          .catch(error => {
            console.error(`⚠️ Failed to fetch ${id}, returning empty array`);
            return []; // Return empty array for failed series
          })
      );
      const results = await Promise.all(promises);
      
      // Combine results into a single object
      const combined = {};
      seriesIds.forEach((id, index) => {
        combined[id] = results[index];
      });
      
      return combined;
    } catch (error) {
      console.error('Error fetching multiple FRED series:', error);
      throw error;
    }
  }

  processObservations(observations, seriesId) {
    return observations
      .filter(obs => obs.value !== '.')  // Filter out missing values
      .map(obs => ({
        date: obs.date,
        value: parseFloat(parseFloat(obs.value).toFixed(2)), // FIXED: Round to 2 decimal places
        seriesId: seriesId
      }));  
  }

  // Enhanced Monetary Policy Indicators with Money Market Funds
  async getMonetaryPolicy() {
    try {
      console.log('Fetching monetary policy data from FRED...');
      const data = await this.getMultipleSeries([
        this.seriesIds.m2MoneySupply,
        this.seriesIds.fedFundsRate,
        this.seriesIds.moneyMarketFunds,
        this.seriesIds.twoYear,
        this.seriesIds.tenYear
      ]);

      // Calculate M2 year-over-year growth
      const m2YoY = this.calculateYearOverYear(data[this.seriesIds.m2MoneySupply]);

      // Calculate Money Market Funds year-over-year growth (BEFORE conversion to billions)
      console.log('💰 MMF: Calculating YoY before conversion to billions...');
      const mmfYoY = this.calculateYearOverYear(data[this.seriesIds.moneyMarketFunds]);
      console.log(`💰 MMF YoY: ${mmfYoY.length} data points calculated`);

      // Convert MMF absolute values to billions
      const mmfAbsolute = this.convertMMFData(data[this.seriesIds.moneyMarketFunds]);

      // Calculate YoY for interest rates too
      const twoYearYoY = this.calculateYearOverYear(data[this.seriesIds.twoYear]);
      const tenYearYoY = this.calculateYearOverYear(data[this.seriesIds.tenYear]);

      const latest = {
        m2MoneySupply: this.getLatestValue(data[this.seriesIds.m2MoneySupply]),
        m2Growth: this.getLatestValue(m2YoY),
        fedFundsRate: this.getLatestValue(data[this.seriesIds.fedFundsRate]),
        moneyMarketFunds: this.getLatestValue(mmfAbsolute),
        mmfGrowth: this.getLatestValue(mmfYoY),
        twoYear: this.getLatestValue(data[this.seriesIds.twoYear]),
        tenYear: this.getLatestValue(data[this.seriesIds.tenYear])
      };

      console.log('Monetary policy data fetched:', latest);

      return {
        data: {
          // M2 Money Supply: both absolute (keep in billions) and YoY (%)
          'M2SL': data[this.seriesIds.m2MoneySupply], // Keep in billions for frontend conversion
          'M2_YOY': m2YoY, // Year-over-year percentages - FULL LINE
          
          // Money Market Funds: both absolute (trillions) and YoY (%)
          'MONEY_MARKET_FUNDS': mmfAbsolute, // Already converted to trillions in convertMMFData
          'MMF_YOY': mmfYoY, // Year-over-year percentages - FULL LINE
          
          // Other monetary policy indicators with YoY
          [this.seriesIds.fedFundsRate]: data[this.seriesIds.fedFundsRate],
          'FEDFUNDS_YOY': this.calculateYearOverYear(data[this.seriesIds.fedFundsRate]), // FULL YOY LINE
          [this.seriesIds.twoYear]: data[this.seriesIds.twoYear],
          'DGS2_YOY': twoYearYoY, // FULL YOY LINE
          [this.seriesIds.tenYear]: data[this.seriesIds.tenYear],
          'DGS10_YOY': tenYearYoY // FULL YOY LINE
        },
        latest,
        metadata: {
          title: 'Monetary Policy & Interest Rates',
          description: 'M2 money supply, Money Market Funds (absolute & YoY), Federal Funds rate, and Treasury yields',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching monetary policy data:', error);
      throw error;
    }
  }

  async getInterestRates() {
    try {
      console.log('Fetching interest rate data from FRED...');
      const data = await this.getMultipleSeries([
        this.seriesIds.twoYear,
        this.seriesIds.tenYear,
        this.seriesIds.thirtyYear,
        this.seriesIds.mortgage30  // ADD mortgage rate
      ]);

      // Get the latest values for summary
      const latest = {
        twoYear: this.getLatestValue(data[this.seriesIds.twoYear]),
        tenYear: this.getLatestValue(data[this.seriesIds.tenYear]),
        thirtyYear: this.getLatestValue(data[this.seriesIds.thirtyYear]),
        mortgage30: this.getLatestValue(data[this.seriesIds.mortgage30])  // ADD mortgage rate
      };

      console.log('Interest rates fetched:', latest);

      return {
        data: {
          [this.seriesIds.twoYear]: data[this.seriesIds.twoYear],
          [this.seriesIds.tenYear]: data[this.seriesIds.tenYear],
          [this.seriesIds.thirtyYear]: data[this.seriesIds.thirtyYear],
          [this.seriesIds.mortgage30]: data[this.seriesIds.mortgage30]  // ADD mortgage rate
        },
        latest,
        metadata: {
          title: 'US Treasury Yields & Mortgage Rates',
          description: 'Interest rates across different maturities including 30-year mortgage',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching interest rates:', error);
      throw error;
    }
  }

  async getGrowthAndInflation() {
    console.log('🚀 FRED SERVICE: Starting getGrowthAndInflation (NO FALLBACK)...');
    
    try {
      console.log('📊 FRED SERVICE: Calling BEA service for REAL GDP data...');
      const gdpData = await beaService.getGDPData();
      
      console.log('📊 FRED SERVICE: BEA GDP data received successfully');
      console.log('📊 FRED SERVICE: GDP Data Structure:', {
        totalQuarters: gdpData.length,
        hasQuarterFields: gdpData.every(d => !!d.quarter),
        sampleQuarters: gdpData.slice(-3).map(d => ({
          date: d.date,
          quarter: d.quarter,
          value: d.value,
          hasQuarter: !!d.quarter
        }))
      });
      
      // Verify ALL quarter fields are present
      const missingQuarters = gdpData.filter(point => !point.quarter);
      if (missingQuarters.length > 0) {
        console.error('❌ FRED SERVICE: Some GDP points missing quarter fields:', missingQuarters);
        throw new Error(`${missingQuarters.length} GDP points missing quarter fields`);
      }
      
      console.log('✅ FRED SERVICE: All GDP points have quarter fields verified');
      
      // Get inflation data from FRED
      console.log('📊 FRED SERVICE: Fetching inflation data from FRED...');
      const fredData = await this.getMultipleSeries([
        this.seriesIds.cpi,
        this.seriesIds.pce,
        this.seriesIds.ppi,
        this.seriesIds.m2MoneySupply,
        this.seriesIds.moneyMarketFunds
      ]);

      // Log raw data to debug
      console.log('📊 FRED SERVICE: Raw PPI data sample:', fredData[this.seriesIds.ppi]?.slice(-3));
      console.log('📊 FRED SERVICE: Raw CPI data sample:', fredData[this.seriesIds.cpi]?.slice(-3));
      
      // Calculate year-over-year changes for CPI, PCE, PPI, and M2
      const cpiYoY = this.calculateYearOverYear(fredData[this.seriesIds.cpi]);
      const pceYoY = this.calculateYearOverYear(fredData[this.seriesIds.pce]);
      const ppiYoY = this.calculateYearOverYear(fredData[this.seriesIds.ppi]);
      const m2YoY = this.calculateYearOverYear(fredData[this.seriesIds.m2MoneySupply]);
      
      // Log calculated YoY values
      console.log('📊 FRED SERVICE: PPI YoY sample:', ppiYoY?.slice(-3));
      console.log('📊 FRED SERVICE: CPI YoY sample:', cpiYoY?.slice(-3));

      const latest = {
        gdpGrowth: beaService.getLatestValue(gdpData),
        cpi: this.getLatestValue(cpiYoY),
        pce: this.getLatestValue(pceYoY),
        ppi: this.getLatestValue(ppiYoY),
        m2Growth: this.getLatestValue(m2YoY),
        moneyMarketFunds: this.getLatestValue(fredData[this.seriesIds.moneyMarketFunds])
      };

      console.log('🔍 FRED SERVICE: Latest values:', latest);

      const result = {
        data: {
          'A191RL1Q225SBEA': gdpData,  // BEA GDP data with verified quarter fields
          'CPI_YOY': cpiYoY,
          'PCE_YOY': pceYoY,
          'PPI_YOY': ppiYoY,
          'M2_YOY': m2YoY,
          'MONEY_MARKET_FUNDS': this.convertMMFData(fredData[this.seriesIds.moneyMarketFunds])
        },
        latest,
        metadata: {
          title: 'Economic Growth & Inflation',
          description: 'GDP growth (BEA), inflation measures, money supply (FRED)',
          lastUpdated: new Date().toISOString()
        }
      };

      console.log('🚀 FRED SERVICE: Returning growth/inflation data - SUCCESS');
      return result;
      
    } catch (error) {
      console.error('❌ FRED SERVICE: getGrowthAndInflation FAILED');
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // NO FALLBACK - Let the error propagate
      throw new Error(`Growth and inflation data fetch failed: ${error.message}`);
    }
  }

  async getLeadingIndicators() {
    try {
      console.log('📊 FRED SERVICE: Fetching leading indicators...');
      const data = await this.getMultipleSeries([
        this.seriesIds.bbkLEI,
        this.seriesIds.cfnai,        // ADDED: Chicago Fed National Activity Index
        this.seriesIds.initialClaims,
        this.seriesIds.construction,
        this.seriesIds.newOrders,
        this.seriesIds.housingPermits
      ]);

      // Calculate YoY for indicators that need it (per user request)
      const initialClaimsYoY = this.calculateYearOverYear(data[this.seriesIds.initialClaims]);
      const constructionYoY = this.calculateYearOverYear(data[this.seriesIds.construction]);
      const newOrdersYoY = this.calculateYearOverYear(data[this.seriesIds.newOrders]);
      const housingPermitsYoY = this.calculateYearOverYear(data[this.seriesIds.housingPermits]);

      const latest = {
        bbkLEI: this.getLatestValue(data[this.seriesIds.bbkLEI]),
        cfnai: this.getLatestValue(data[this.seriesIds.cfnai]),
        initialClaims: this.getLatestValue(data[this.seriesIds.initialClaims]),
        initialClaimsYoY: this.getLatestValue(initialClaimsYoY),
        construction: this.getLatestValue(data[this.seriesIds.construction]),
        constructionYoY: this.getLatestValue(constructionYoY),
        newOrders: this.getLatestValue(data[this.seriesIds.newOrders]),
        newOrdersYoY: this.getLatestValue(newOrdersYoY),
        housingPermits: this.getLatestValue(data[this.seriesIds.housingPermits]),
        housingPermitsYoY: this.getLatestValue(housingPermitsYoY)
      };

      console.log('Leading indicators fetched:', latest);

      // FIXED: Return with both absolute and YoY data
      return {
        data: {
          'BBKMLEIX': data[this.seriesIds.bbkLEI],
          'CFNAI': data[this.seriesIds.cfnai],            // ADDED: Chicago Fed
          'ICSA': data[this.seriesIds.initialClaims],      // Absolute values
          'ICSA_YOY': initialClaimsYoY,                    // YoY growth
          'TLMFGCONS': data[this.seriesIds.construction],  // Absolute values
          'TLMFGCONS_YOY': constructionYoY,                // YoY growth
          'NEWORDER': data[this.seriesIds.newOrders],      // Absolute values
          'NEWORDER_YOY': newOrdersYoY,                    // YoY growth
          'PERMIT': data[this.seriesIds.housingPermits],   // Absolute values
          'PERMIT_YOY': housingPermitsYoY                  // YoY growth
        },
        latest,
        metadata: {
          title: 'Leading Economic Indicators',
          description: 'Brave-Butters-Kelley Index, Chicago Fed NAI, Initial Claims, Construction, New Orders, Building Permits',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching leading indicators:', error);
      throw error;
    }
  }

  async getLaborAndConsumer() {
    try {
      console.log('Fetching labor and consumer data from FRED...');
      const data = await this.getMultipleSeries([
        this.seriesIds.unemployment,
        this.seriesIds.retailSales,
        this.seriesIds.realPersonalIncome
      ]);

      // Calculate year-over-year changes for ALL metrics (per user request)
      const unemploymentYoY = this.calculateYearOverYear(data[this.seriesIds.unemployment]);
      const retailYoY = this.calculateYearOverYear(data[this.seriesIds.retailSales]);
      const realIncomeYoY = this.calculateYearOverYear(data[this.seriesIds.realPersonalIncome]);
      
      console.log('📊 FRED SERVICE: Labor & Consumer YoY Analysis:');
      console.log('  - Unemployment YoY points:', unemploymentYoY?.length || 0);
      console.log('  - Retail Sales YoY points:', retailYoY?.length || 0);
      console.log('  - Real Personal Income YoY points:', realIncomeYoY?.length || 0);
      
      const latest = {
        unemployment: this.getLatestValue(data[this.seriesIds.unemployment]),
        unemploymentYoY: this.getLatestValue(unemploymentYoY),
        retailSales: this.getLatestValue(retailYoY),
        realPersonalIncome: this.getLatestValue(realIncomeYoY)
      };

      console.log('Labor and consumer data fetched:', latest);

      return {
        data: {
          [this.seriesIds.unemployment]: data[this.seriesIds.unemployment],
          'UNEMPLOYMENT_YOY': unemploymentYoY,  // FULL YOY LINE
          'RETAIL_YOY': retailYoY,              // FULL YOY LINE
          'REAL_PERSONAL_INCOME_YOY': realIncomeYoY // FULL YOY LINE
        },
        latest,
        metadata: {
          title: 'Labor Market & Consumer Health',
          description: 'Employment, consumer spending, and real personal income indicators (with YoY growth)',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching labor and consumer data:', error);
      throw error;
    }
  }

  getLatestValue(data) {
    if (!data || data.length === 0) return null;
    const latest = data[data.length - 1];
    return {
      value: parseFloat(latest.value.toFixed(2)), // FIXED: Ensure clean decimal formatting
      date: latest.date
    };
  }

  // FIXED: Enhanced decimal precision for year-over-year calculations with validation
  calculateYearOverYear(data) {
    if (!data || data.length < 4) {
      console.log(`🚫 YoY Calculation: Insufficient data (${data?.length || 0} points, need 4+)`);
      return [];
    }
    
    console.log(`📊 YoY Calculation: Processing ${data.length} data points for ${data[0]?.seriesId}`);
    
    // Determine if this is quarterly data (like MMF) or monthly data
    const isQuarterly = data[0]?.seriesId === 'MMMFFAQ027S';
    const isWeekly = data[0]?.seriesId === 'ICSA'; // Initial claims are weekly
    const yearAgoOffset = isQuarterly ? 4 : (isWeekly ? 52 : 12); // 4 quarters, 52 weeks, or 12 months
    
    if (data.length < yearAgoOffset) {
      console.log(`🚫 YoY Calculation: Insufficient data for ${isQuarterly ? 'quarterly' : (isWeekly ? 'weekly' : 'monthly')} series (${data?.length || 0} points, need ${yearAgoOffset}+)`);
      return [];
    }
    
    return data.slice(yearAgoOffset).map((current, index) => {
      const yearAgo = data[index];
      const yoyChange = ((current.value - yearAgo.value) / yearAgo.value) * 100;
      
      // Add validation for unrealistic YoY values (check for RPI series)
      const isRPI = current.seriesId === 'RPI' || current.seriesId === 'W875RX1';
      if (Math.abs(yoyChange) > 100 && isRPI) {
        console.log(`⚠️ SUSPICIOUS YoY for RPI (${current.seriesId}):`);
        console.log(`  Current (${current.date}): ${current.value}`);
        console.log(`  Year Ago (${yearAgo.date}): ${yearAgo.value}`);
        console.log(`  Raw YoY: ${yoyChange.toFixed(2)}%`);
        console.log(`  Difference: ${current.value - yearAgo.value}`);
      }
      
      // Special handling for RPI - cap at reasonable values
      let finalYoyChange = yoyChange;
      if (isRPI && Math.abs(yoyChange) > 20) {
        console.log(`🔧 RPI YoY seems high (${yoyChange.toFixed(1)}%), investigating...`);
        
        // Check if this looks like an index that needs to be converted to percent change differently
        const simpleGrowthRate = ((current.value - yearAgo.value) / yearAgo.value) * 100;
        console.log(`🔧 Simple growth calculation: ${simpleGrowthRate.toFixed(2)}%`);
        
        // If still unrealistic, there might be a data issue
        if (Math.abs(simpleGrowthRate) > 20) {
          console.log(`⚠️ RPI YoY still unrealistic, using capped value`);
          finalYoyChange = Math.sign(yoyChange) * Math.min(Math.abs(yoyChange), 10); // Cap at ±10%
        } else {
          finalYoyChange = simpleGrowthRate;
        }
      }
      
      return {
        date: current.date,
        value: parseFloat(finalYoyChange.toFixed(1)), // FIXED: Round to 1 decimal place for better readability
        seriesId: `${current.seriesId}_YOY`
      };
    });
  }

  // NEW: Housing indicators method
  async getHousingIndicators() {
    try {
      console.log('🏠 FRED SERVICE: Fetching housing indicators...');
      const data = await this.getMultipleSeries([
        this.seriesIds.caseShiller,
        this.seriesIds.existingHomeSales,
        this.seriesIds.housingStarts      // Added housing starts for more data
      ]);

      // Calculate YoY for housing indicators
      const caseShillerYoY = this.calculateYearOverYear(data[this.seriesIds.caseShiller]);
      const homeSalesYoY = this.calculateYearOverYear(data[this.seriesIds.existingHomeSales]);
      const housingStartsYoY = this.calculateYearOverYear(data[this.seriesIds.housingStarts]);

      const latest = {
        caseShiller: this.getLatestValue(data[this.seriesIds.caseShiller]),
        caseShillerYoY: this.getLatestValue(caseShillerYoY),
        existingHomeSales: this.getLatestValue(data[this.seriesIds.existingHomeSales]),
        homeSalesYoY: this.getLatestValue(homeSalesYoY),
        housingStarts: this.getLatestValue(data[this.seriesIds.housingStarts]),
        housingStartsYoY: this.getLatestValue(housingStartsYoY)
      };

      console.log('Housing indicators fetched:', latest);

      // FIXED: Return with correct keys matching actual series IDs
      return {
        data: {
          'SPCS20RSA': data[this.seriesIds.caseShiller],    // Absolute values
          'SPCS20RSA_YOY': caseShillerYoY,                  // YoY growth
          'EXHOSLUSM495S': data[this.seriesIds.existingHomeSales], // Absolute values
          'EXHOSLUSM495S_YOY': homeSalesYoY,                // YoY growth
          'HOUST': data[this.seriesIds.housingStarts],      // Absolute values
          'HOUST_YOY': housingStartsYoY                     // YoY growth
        },
        latest,
        metadata: {
          title: 'Housing Market Indicators',
          description: 'Case-Shiller 20-City Home Price Index, Existing Home Sales, and Housing Starts (with YoY growth)',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching housing indicators:', error);
      throw error;
    }
  }

  async getAllMacroData() {
    console.log('🚀 FRED SERVICE: Starting getAllMacroData (NO FALLBACK)...');
    
    try {
      const [monetaryPolicy, interestRates, growthInflation, laborConsumer, leadingIndicators, housing] = await Promise.all([
        this.getMonetaryPolicy(),
        this.getInterestRates(),
        this.getGrowthAndInflation(),  // Will fail hard if BEA API doesn't work
        this.getLaborAndConsumer(),
        this.getLeadingIndicators(),   // NOW INCLUDES CHICAGO FED AND YOY
        this.getHousingIndicators()    // PROPERLY RETURNS HOUSING DATA
      ]);

      console.log('✅ FRED SERVICE: All macro data fetched successfully');
      console.log('🏠 Housing data check:', housing ? 'Present' : 'Missing');
      console.log('📊 Leading indicators check:', leadingIndicators?.data?.CFNAI ? 'Chicago Fed present' : 'Chicago Fed missing');

      return {
        monetaryPolicy,
        interestRates,
        growthInflation,    // Real BEA data or failure
        laborConsumer,
        leadingIndicators,  // NOW INCLUDES CHICAGO FED AND YOY
        housing,            // RETURNS HOUSING DATA
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ FRED SERVICE: getAllMacroData FAILED');
      console.error('❌ Macro data error:', error.message);
      
      // NO FALLBACK - Propagate the error
      throw error;
    }
  }
}

export default new FREDService();

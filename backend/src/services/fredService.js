import axios from 'axios';
import beaService from './beaService.js';

class FREDService {
  constructor() {
    this.baseURL = 'https://api.stlouisfed.org/fred';
    this.apiKey = process.env.FRED_API_KEY || 'dca5bb7524d0b194a9963b449e69c655';
    
    // FRED series IDs for our indicators
    this.seriesIds = {
      // Interest rates
      twoYear: 'DGS2',      // 2-Year Treasury Constant Maturity Rate
      tenYear: 'DGS10',     // 10-Year Treasury Constant Maturity Rate
      thirtyYear: 'DGS30',  // 30-Year Treasury Constant Maturity Rate
      
      // Monetary policy indicators - NEW!
      m2MoneySupply: 'M2SL',         // M2 Money Supply
      fedFundsRate: 'FEDFUNDS',      // Effective Federal Funds Rate
      
      // Growth and inflation (GDP now from BEA directly)
      cpi: 'CPIAUCSL',               // Consumer Price Index
      pce: 'PCEPI',                  // Personal Consumption Expenditures Price Index
      
      // Labor and consumer
      unemployment: 'UNRATE',         // Civilian Unemployment Rate
      retailSales: 'RSAFS'           // Advance Retail Sales: Retail Trade and Food Services
    };
  }

  async getSeriesData(seriesId, startDate = null, endDate = null) {
    try {
      // FIXED: Calculate start date if not provided (default to 2 years ago)
      if (!startDate) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 2);
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
        limit: 1000  // FIXED: Ensure we don't hit data limits
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
      throw error;
    }
  }

  async getMultipleSeries(seriesIds, startDate = null, endDate = null) {
    try {
      const promises = seriesIds.map(id => this.getSeriesData(id, startDate, endDate));
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

  // NEW: Monetary Policy Indicators
  async getMonetaryPolicy() {
    try {
      console.log('Fetching monetary policy data from FRED...');
      const data = await this.getMultipleSeries([
        this.seriesIds.m2MoneySupply,
        this.seriesIds.fedFundsRate,
        this.seriesIds.twoYear,
        this.seriesIds.tenYear
      ]);

      // Calculate M2 year-over-year growth
      const m2YoY = this.calculateYearOverYear(data[this.seriesIds.m2MoneySupply]);

      const latest = {
        m2MoneySupply: this.getLatestValue(data[this.seriesIds.m2MoneySupply]),
        m2Growth: this.getLatestValue(m2YoY),
        fedFundsRate: this.getLatestValue(data[this.seriesIds.fedFundsRate]),
        twoYear: this.getLatestValue(data[this.seriesIds.twoYear]),
        tenYear: this.getLatestValue(data[this.seriesIds.tenYear])
      };

      console.log('Monetary policy data fetched:', latest);

      return {
        data: {
          [this.seriesIds.m2MoneySupply]: data[this.seriesIds.m2MoneySupply],
          'M2_YOY': m2YoY,
          [this.seriesIds.fedFundsRate]: data[this.seriesIds.fedFundsRate],
          [this.seriesIds.twoYear]: data[this.seriesIds.twoYear],
          [this.seriesIds.tenYear]: data[this.seriesIds.tenYear]
        },
        latest,
        metadata: {
          title: 'Monetary Policy & Interest Rates',
          description: 'M2 money supply, Federal Funds rate, and Treasury yields',
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
        this.seriesIds.thirtyYear
      ]);

      // Get the latest values for summary
      const latest = {
        twoYear: this.getLatestValue(data[this.seriesIds.twoYear]),
        tenYear: this.getLatestValue(data[this.seriesIds.tenYear]),
        thirtyYear: this.getLatestValue(data[this.seriesIds.thirtyYear])
      };

      console.log('Interest rates fetched:', latest);

      return {
        data,
        latest,
        metadata: {
          title: 'US Treasury Yields',
          description: 'Interest rates across different maturities',
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
        this.seriesIds.pce
      ]);

      // Calculate year-over-year changes for CPI and PCE
      const cpiYoY = this.calculateYearOverYear(fredData[this.seriesIds.cpi]);
      const pceYoY = this.calculateYearOverYear(fredData[this.seriesIds.pce]);

      const latest = {
        gdpGrowth: beaService.getLatestValue(gdpData),
        cpi: this.getLatestValue(cpiYoY),
        pce: this.getLatestValue(pceYoY)
      };

      console.log('🔍 FRED SERVICE: Latest values:', latest);

      const result = {
        data: {
          'A191RL1Q225SBEA': gdpData,  // BEA GDP data with verified quarter fields
          'CPI_YOY': cpiYoY,
          'PCE_YOY': pceYoY
        },
        latest,
        metadata: {
          title: 'Economic Growth & Inflation',
          description: 'GDP growth (BEA) and inflation measures (FRED)',
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

  async getLaborAndConsumer() {
    try {
      console.log('Fetching labor and consumer data from FRED...');
      const data = await this.getMultipleSeries([
        this.seriesIds.unemployment,
        this.seriesIds.retailSales
      ]);

      // Calculate year-over-year change for retail sales with FIXED decimal formatting
      const retailYoY = this.calculateYearOverYear(data[this.seriesIds.retailSales]);

      const latest = {
        unemployment: this.getLatestValue(data[this.seriesIds.unemployment]),
        retailSales: this.getLatestValue(retailYoY)
      };

      console.log('Labor and consumer data fetched:', latest);

      return {
        data: {
          [this.seriesIds.unemployment]: data[this.seriesIds.unemployment],
          'RETAIL_YOY': retailYoY
        },
        latest,
        metadata: {
          title: 'Labor Market & Consumer Health',
          description: 'Employment and consumer spending indicators',
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

  // FIXED: Enhanced decimal precision for year-over-year calculations
  calculateYearOverYear(data) {
    if (!data || data.length < 12) return [];
    
    return data.slice(12).map((current, index) => {
      const yearAgo = data[index];
      const yoyChange = ((current.value - yearAgo.value) / yearAgo.value) * 100;
      
      return {
        date: current.date,
        value: parseFloat(yoyChange.toFixed(1)), // FIXED: Round to 1 decimal place for better readability
        seriesId: `${current.seriesId}_YOY`
      };
    });
  }

  async getAllMacroData() {
    console.log('🚀 FRED SERVICE: Starting getAllMacroData (NO FALLBACK)...');
    
    try {
      const [monetaryPolicy, interestRates, growthInflation, laborConsumer] = await Promise.all([
        this.getMonetaryPolicy(),
        this.getInterestRates(),
        this.getGrowthAndInflation(),  // Will fail hard if BEA API doesn't work
        this.getLaborAndConsumer()
      ]);

      console.log('✅ FRED SERVICE: All macro data fetched successfully');

      return {
        monetaryPolicy,
        interestRates,
        growthInflation,    // Real BEA data or failure
        laborConsumer,
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
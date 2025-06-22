import axios from 'axios';

class ImprovedFREDService {
  constructor() {
    this.baseURL = 'https://api.stlouisfed.org/fred';
    this.apiKey = process.env.FRED_API_KEY || 'dca5bb7524d0b194a9963b449e69c655';
    
    // FRED series IDs for our indicators - using the most reliable series
    this.seriesIds = {
      // Interest rates
      twoYear: 'DGS2',      // 2-Year Treasury Constant Maturity Rate
      tenYear: 'DGS10',     // 10-Year Treasury Constant Maturity Rate
      thirtyYear: 'DGS30',  // 30-Year Treasury Constant Maturity Rate
      
      // Growth and inflation
      gdpGrowth: 'A191RL1Q225SBEA',  // Real GDP Growth Rate (Quarterly, Annualized)
      cpi: 'CPIAUCSL',               // Consumer Price Index for All Urban Consumers
      pce: 'PCEPI',                  // Personal Consumption Expenditures Price Index
      
      // Labor and consumer
      unemployment: 'UNRATE',                    // Civilian Unemployment Rate
      retailSales: 'MRTSSM44X72USS',            // Full Monthly Retail Trade Survey (more complete than RSAFS)
      retailSalesAdvance: 'RSAFS'               // Backup: Advance Retail Sales
    };
  }

  async getSeriesData(seriesId, startDate = null, endDate = null) {
    try {
      // Calculate start date if not provided (default to 3 years ago for better charts)
      if (!startDate) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 3);
        startDate = date.toISOString().split('T')[0];
      }

      // Calculate end date if not provided (default to today)
      if (!endDate) {
        endDate = new Date().toISOString().split('T')[0];
      }

      const params = {
        series_id: seriesId,
        api_key: this.apiKey,
        file_type: 'json',
        observation_start: startDate,
        observation_end: endDate,
        sort_order: 'asc',
        limit: 100000  // Ensure we get all data points
      };

      console.log(`Fetching FRED series ${seriesId} from ${startDate} to ${endDate}`);

      const response = await axios.get(`${this.baseURL}/series/observations`, { params });
      
      if (response.data && response.data.observations) {
        const processedData = this.processObservations(response.data.observations, seriesId);
        console.log(`Fetched ${processedData.length} observations for ${seriesId}`);
        
        if (processedData.length > 0) {
          console.log(`Date range: ${processedData[0].date} to ${processedData[processedData.length - 1].date}`);
        }
        
        return processedData;
      }
      
      throw new Error(`No data received for series: ${seriesId}`);
    } catch (error) {
      console.error(`Error fetching FRED data for ${seriesId}:`, error.message);
      
      // For retail sales, try the backup series if primary fails
      if (seriesId === this.seriesIds.retailSales) {
        console.log('Trying backup retail sales series...');
        return await this.getSeriesData(this.seriesIds.retailSalesAdvance, startDate, endDate);
      }
      
      throw error;
    }
  }

  async getMultipleSeries(seriesIds, startDate = null, endDate = null) {
    try {
      console.log(`Fetching multiple FRED series: ${seriesIds.join(', ')}`);
      
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
      .filter(obs => obs.value !== '.' && obs.value !== null && obs.value !== undefined)  // Filter out missing values
      .map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value),
        seriesId: seriesId
      }))
      .filter(obs => !isNaN(obs.value));  // Remove any NaN values
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

      console.log('Interest rates fetched successfully');
      console.log('Data points:', {
        twoYear: data[this.seriesIds.twoYear]?.length || 0,
        tenYear: data[this.seriesIds.tenYear]?.length || 0,
        thirtyYear: data[this.seriesIds.thirtyYear]?.length || 0
      });

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
    try {
      console.log('Fetching growth and inflation data from FRED...');
      const data = await this.getMultipleSeries([
        this.seriesIds.gdpGrowth,
        this.seriesIds.cpi,
        this.seriesIds.pce
      ]);

      // Calculate year-over-year changes for CPI and PCE with improved handling
      const cpiYoY = this.calculateYearOverYearImproved(data[this.seriesIds.cpi], 'CPI_YOY');
      const pceYoY = this.calculateYearOverYearImproved(data[this.seriesIds.pce], 'PCE_YOY');

      const latest = {
        gdpGrowth: this.getLatestValue(data[this.seriesIds.gdpGrowth]),
        cpi: this.getLatestValue(cpiYoY),
        pce: this.getLatestValue(pceYoY)
      };

      console.log('Growth and inflation data fetched successfully');
      console.log('Data points:', {
        gdp: data[this.seriesIds.gdpGrowth]?.length || 0,
        cpiYoY: cpiYoY?.length || 0,
        pceYoY: pceYoY?.length || 0
      });

      return {
        data: {
          [this.seriesIds.gdpGrowth]: data[this.seriesIds.gdpGrowth],
          'CPI_YOY': cpiYoY,
          'PCE_YOY': pceYoY
        },
        latest,
        metadata: {
          title: 'Economic Growth & Inflation',
          description: 'GDP growth and inflation measures',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching growth and inflation data:', error);
      throw error;
    }
  }

  async getLaborAndConsumer() {
    try {
      console.log('Fetching labor and consumer data from FRED...');
      const data = await this.getMultipleSeries([
        this.seriesIds.unemployment,
        this.seriesIds.retailSales
      ]);

      // Calculate year-over-year change for retail sales with improved handling
      const retailYoY = this.calculateYearOverYearImproved(data[this.seriesIds.retailSales], 'RETAIL_YOY');

      const latest = {
        unemployment: this.getLatestValue(data[this.seriesIds.unemployment]),
        retailSales: this.getLatestValue(retailYoY)
      };

      console.log('Labor and consumer data fetched successfully');
      console.log('Data points:', {
        unemployment: data[this.seriesIds.unemployment]?.length || 0,
        retailYoY: retailYoY?.length || 0
      });

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
      value: latest.value,
      date: latest.date
    };
  }

  // Improved year-over-year calculation that handles missing data better
  calculateYearOverYearImproved(data, newSeriesId) {
    if (!data || data.length < 12) return [];
    
    console.log(`Calculating YoY for ${newSeriesId}, input data points: ${data.length}`);
    
    const result = [];
    
    // Create a map for quick date lookups
    const dataMap = new Map();
    data.forEach(item => dataMap.set(item.date, item.value));
    
    // Sort data by date to ensure proper processing
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (let i = 0; i < sortedData.length; i++) {
      const current = sortedData[i];
      const currentDate = new Date(current.date);
      
      // Calculate the date 12 months ago
      const yearAgoDate = new Date(currentDate);
      yearAgoDate.setFullYear(yearAgoDate.getFullYear() - 1);
      
      // Look for the closest date within a reasonable range (±15 days)
      let yearAgoValue = null;
      for (let dayOffset = 0; dayOffset <= 15; dayOffset++) {
        // Try exact date first, then +/- days
        const dates = [
          new Date(yearAgoDate.getTime()),
          new Date(yearAgoDate.getTime() + dayOffset * 24 * 60 * 60 * 1000),
          new Date(yearAgoDate.getTime() - dayOffset * 24 * 60 * 60 * 1000)
        ];
        
        for (const testDate of dates) {
          const testDateStr = testDate.toISOString().split('T')[0];
          if (dataMap.has(testDateStr)) {
            yearAgoValue = dataMap.get(testDateStr);
            break;
          }
        }
        
        if (yearAgoValue !== null) break;
      }
      
      if (yearAgoValue !== null && yearAgoValue > 0) {
        const yoyChange = ((current.value - yearAgoValue) / yearAgoValue) * 100;
        
        result.push({
          date: current.date,
          value: yoyChange,
          seriesId: newSeriesId
        });
      }
    }
    
    console.log(`YoY calculation complete for ${newSeriesId}: ${result.length} points generated`);
    
    if (result.length > 0) {
      console.log(`YoY date range: ${result[0].date} to ${result[result.length - 1].date}`);
    }
    
    return result;
  }

  async getAllMacroData() {
    try {
      console.log('=== Fetching All Macro Data ===');
      
      const [interestRates, growthInflation, laborConsumer] = await Promise.all([
        this.getInterestRates(),
        this.getGrowthAndInflation(),
        this.getLaborAndConsumer()
      ]);

      console.log('All macro data fetched successfully');

      return {
        interestRates,
        growthInflation,
        laborConsumer,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching all macro data:', error);
      throw error;
    }
  }
}

export default new ImprovedFREDService();

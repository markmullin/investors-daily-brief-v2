import axios from 'axios';

class BEAService {
  constructor() {
    this.baseURL = 'https://apps.bea.gov/api/data';
    this.apiKey = '53654C61-3EBF-4CBC-B5A5-597A7DA8CC26';
  }

  async getGDPData() {
    console.log('🏛️ BEA SERVICE: === STARTING GDP + CORPORATE PROFITS ===');
    
    try {
      // Get GDP data first
      const gdpData = await this.getGDPDataOnly();
      console.log(`✅ BEA GDP: Got ${gdpData.length} quarters`);
      
      // Get Corporate Profits data with CORRECT table and series codes
      console.log('💰 BEA: Starting Corporate Profits fetch...');
      let corporateProfitsData = [];
      
      try {
        const profitsResponse = await this.getCorporateProfitsData();
        corporateProfitsData = profitsResponse;
        console.log(`✅ BEA PROFITS: Got ${corporateProfitsData.length} quarters`);
      } catch (profitsError) {
        console.error('❌ BEA PROFITS FAILED:', profitsError.message);
        corporateProfitsData = [];
      }

      // Merge data
      const mergedData = gdpData.map(gdpPoint => {
        const profitsPoint = corporateProfitsData.find(p => p.quarter === gdpPoint.quarter);
        
        const result = {
          ...gdpPoint,
          corporateProfits: profitsPoint ? profitsPoint.value : null,
          corporateProfitsGrowth: profitsPoint ? profitsPoint.growth : null
        };
        
        return result;
      });

      console.log('🔄 BEA MERGE RESULT:');
      mergedData.slice(-3).forEach(point => {
        console.log(`   ${point.quarter}: GDP ${point.value}%, Profits ${point.corporateProfitsGrowth ? point.corporateProfitsGrowth.toFixed(1) + '%' : 'NULL'}`);
      });

      return mergedData;

    } catch (error) {
      console.error('❌ BEA SERVICE FAILED:', error.message);
      throw error;
    }
  }

  async getGDPDataOnly() {
    // Get only last 2 years of data (8 quarters)
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 2;
    const years = `${startYear},${startYear + 1},${startYear + 2}`;
    
    const params = {
      UserID: this.apiKey,
      method: 'GetData',
      datasetname: 'NIPA',
      TableName: 'T10101',
      Frequency: 'Q',
      Year: years, // Only get last 3 years instead of ALL
      ResultFormat: 'json'
    };

    const response = await axios.get(this.baseURL, { params, timeout: 30000 });
    
    if (!response.data?.BEAAPI?.Results?.Data) {
      throw new Error('BEA GDP API response missing data');
    }

    const results = response.data.BEAAPI.Results.Data;
    
    const gdpData = results
      .filter(item => 
        item.LineDescription === 'Gross domestic product' &&
        item.SeriesCode === 'A191RL' &&
        item.DataValue !== '...'
      )
      .map(item => ({
        date: this.calculateReleaseDate(item.TimePeriod),
        value: parseFloat(item.DataValue),
        quarter: item.TimePeriod,
        originalDate: item.TimePeriod,
        releaseDate: this.calculateReleaseDate(item.TimePeriod),
        seriesId: 'BEA_GDP'
      }))
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

    return gdpData;
  }

  async getCorporateProfitsData() {
    console.log('💰 CORPORATE PROFITS: Using correct Table T61600D...');
    
    // Get only last 2 years of corporate profits data
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 2;
    const years = `${startYear},${startYear + 1},${startYear + 2}`;
    
    const params = {
      UserID: this.apiKey,
      method: 'GetData',
      datasetname: 'NIPA',
      TableName: 'T61600D', // ✅ CORRECT TABLE: Corporate Profits by Industry
      Frequency: 'Q',
      Year: years, // Only get last 3 years instead of ALL
      ResultFormat: 'json'
    };

    console.log('📞 Calling BEA API for Corporate Profits Table 6.16D...');
    const response = await axios.get(this.baseURL, { params, timeout: 30000 });
    console.log(`📡 BEA Response Status: ${response.status}`);
    
    if (!response.data?.BEAAPI?.Results?.Data) {
      throw new Error('BEA Corporate Profits API response missing data');
    }

    const results = response.data.BEAAPI.Results.Data;
    console.log(`📊 Corporate Profits Table: ${results.length} total records`);

    // ✅ FIXED SERIES CODES (removed -Q suffix)
    const targetSeries = ['A051RC', 'A052RC']; // Corporate profits with adjustments
    const profitsData = results.filter(item => 
      targetSeries.includes(item.SeriesCode) &&
      item.DataValue !== '..' &&
      item.DataValue !== '.' &&
      !isNaN(parseFloat(item.DataValue.replace(/,/g, ''))) // ✅ REMOVE COMMAS BEFORE PARSING
    );

    console.log(`🎯 Found ${profitsData.length} corporate profits records with CORRECT series codes`);

    if (profitsData.length === 0) {
      // Show available series codes for debugging
      const availableSeries = [...new Set(results.map(item => item.SeriesCode))];
      console.log('📋 Available Series Codes:', availableSeries.slice(0, 10));
      throw new Error('No corporate profits data found with target series codes');
    }

    console.log('📋 Found Corporate Profits Series:');
    const uniqueSeries = [...new Set(profitsData.map(item => item.SeriesCode))];
    uniqueSeries.forEach(code => {
      const sample = profitsData.find(item => item.SeriesCode === code);
      console.log(`   ${code}: ${sample.LineDescription}`);
    });

    // Use A051RC (Corporate profits with inventory valuation adjustment) as primary
    const primaryData = profitsData.filter(item => item.SeriesCode === 'A051RC');
    
    if (primaryData.length === 0) {
      console.log('⚠️ A051RC not found, using A052RC as fallback...');
      const fallbackData = profitsData.filter(item => item.SeriesCode === 'A052RC');
      if (fallbackData.length === 0) {
        throw new Error('Neither A051RC nor A052RC found in data');
      }
      return this.processCorporateProfitsData(fallbackData);
    }

    return this.processCorporateProfitsData(primaryData);
  }

  processCorporateProfitsData(profitsData) {
    // Process and sort data
    const processedData = profitsData
      .map(item => ({
        quarter: item.TimePeriod,
        value: parseFloat(item.DataValue.replace(/,/g, '')), // ✅ REMOVE COMMAS BEFORE PARSING
        rawValue: item.DataValue, // Keep original for debugging
        description: item.LineDescription,
        seriesCode: item.SeriesCode
      }))
      .sort((a, b) => {
        const [yearA, qA] = a.quarter.split('Q');
        const [yearB, qB] = b.quarter.split('Q');
        return yearA !== yearB ? yearA - yearB : qA - qB;
      });

    console.log('🔍 FIXED PROCESSED DATA - Last 5 quarters:');
    processedData.slice(-5).forEach(point => {
      console.log(`   ${point.quarter}: PROCESSED=${point.value.toLocaleString()}, RAW="${point.rawValue}"`);
    });

    // Calculate YoY growth rates
    const profitsWithGrowth = processedData.map((current, index) => {
      let growth = null;
      if (index >= 4) {
        const yearAgo = processedData[index - 4];
        if (yearAgo && yearAgo.value !== 0) {
          growth = ((current.value - yearAgo.value) / Math.abs(yearAgo.value)) * 100;
        }
      }
      
      return {
        ...current,
        growth: growth
      };
    });

    console.log('💰 CORRECTED Last 3 quarters with growth:');
    profitsWithGrowth.slice(-3).forEach(point => {
      console.log(`   ${point.quarter}: $${(point.value/1000).toFixed(1)}B (${point.growth ? point.growth.toFixed(1) + '%' : 'N/A'} YoY)`);
    });

    return profitsWithGrowth;
  }

  calculateReleaseDate(quarter) {
    const [year, q] = quarter.split('Q');
    const quarterNum = parseInt(q);
    const yearNum = parseInt(year);
    
    let releaseMonth, releaseDay, releaseYear = yearNum;
    
    switch (quarterNum) {
      case 1: releaseMonth = 4; releaseDay = 30; break;
      case 2: releaseMonth = 7; releaseDay = 30; break;
      case 3: releaseMonth = 10; releaseDay = 30; break;
      case 4: releaseMonth = 1; releaseDay = 30; releaseYear = yearNum + 1; break;
      default: throw new Error(`Invalid quarter: ${quarter}`);
    }
    
    return `${releaseYear}-${releaseMonth.toString().padStart(2, '0')}-${releaseDay.toString().padStart(2, '0')}`;
  }

  getLatestValue(data) {
    if (!data || data.length === 0) return null;
    const latest = data[data.length - 1];
    return {
      value: latest.value,
      date: latest.releaseDate || latest.date,
      quarter: latest.quarter,
      corporateProfits: latest.corporateProfits,
      corporateProfitsGrowth: latest.corporateProfitsGrowth
    };
  }

  getRecentQuarters(data, quarters = 8) {
    if (!data || data.length === 0) return [];
    return data.slice(-quarters);
  }
}

export default new BEAService();

// Data source manager for handling multiple financial data sources
import marketDataService from '../marketDataService.js';
import alphaVantageService from './alphaVantageService.js';

// List of available data sources
const dataSources = {
  eod: marketDataService,
  alphavantage: alphaVantageService
};

// Default source priority order
const DEFAULT_PRIORITY = ['eod', 'alphavantage'];

// Data source manager
const dataSourceManager = {
  /**
   * Get available data sources
   * @returns {Object} Available data sources and their status
   */
  getAvailableSources: () => {
    const sources = {};
    
    for (const [key, service] of Object.entries(dataSources)) {
      sources[key] = {
        available: service.isAvailable ? service.isAvailable() : true,
        name: getSourceName(key)
      };
    }
    
    return sources;
  },
  
  /**
   * Get historical price data using the best available source
   * @param {string} symbol Stock symbol
   * @param {Date} startDate Start date
   * @param {Date} endDate End date
   * @param {Array} metrics Metrics to retrieve
   * @param {Array} sourcePriority Priority order for data sources
   * @returns {Promise<Object>} Historical data and source info
   */
  getHistoricalData: async (symbol, startDate, endDate, metrics = ['price'], sourcePriority = DEFAULT_PRIORITY) => {
    // Try sources in priority order
    for (const sourceKey of sourcePriority) {
      const source = dataSources[sourceKey];
      
      if (!source || (source.isAvailable && !source.isAvailable())) {
        continue;
      }
      
      try {
        const data = await source.getHistoricalData(symbol, startDate, endDate, metrics);
        
        return {
          data,
          source: {
            id: sourceKey,
            name: getSourceName(sourceKey)
          }
        };
      } catch (error) {
        console.warn(`Failed to get data from ${sourceKey} for ${symbol}:`, error.message);
        // Continue to next source
      }
    }
    
    // If we get here, all sources failed
    throw new Error(`Could not retrieve historical data for ${symbol} from any available source`);
  },
  
  /**
   * Combine data from multiple sources with priority
   * @param {string} symbol Stock symbol
   * @param {Date} startDate Start date
   * @param {Date} endDate End date
   * @param {Array} metrics Metrics to retrieve
   * @param {Array} sourcePriority Priority order for data sources
   * @returns {Promise<Object>} Combined data and source info
   */
  getCombinedData: async (symbol, startDate, endDate, metrics = ['price'], sourcePriority = DEFAULT_PRIORITY) => {
    const results = {};
    const sourceInfo = {};
    let combinedData = [];
    
    // Try to get data from each source
    for (const sourceKey of sourcePriority) {
      const source = dataSources[sourceKey];
      
      if (!source || (source.isAvailable && !source.isAvailable())) {
        continue;
      }
      
      try {
        const data = await source.getHistoricalData(symbol, startDate, endDate, metrics);
        results[sourceKey] = data;
        sourceInfo[sourceKey] = getSourceName(sourceKey);
      } catch (error) {
        console.warn(`Failed to get data from ${sourceKey} for ${symbol}:`, error.message);
        // Continue to next source
      }
    }
    
    // If we have no data, throw an error
    if (Object.keys(results).length === 0) {
      throw new Error(`Could not retrieve data for ${symbol} from any available source`);
    }
    
    // Combine data, giving priority to sources based on the order
    const dateMap = new Map();
    
    for (const sourceKey of sourcePriority) {
      const data = results[sourceKey];
      
      if (!data) continue;
      
      for (const item of data) {
        const date = item.date;
        
        if (!dateMap.has(date)) {
          dateMap.set(date, { ...item, _source: sourceKey });
        }
      }
    }
    
    // Convert map to array and sort by date
    combinedData = Array.from(dateMap.values());
    combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return {
      data: combinedData,
      sources: sourceInfo
    };
  },
  
  /**
   * Get company information from the best available source
   * @param {string} symbol Stock symbol
   * @param {Array} sourcePriority Priority order for data sources
   * @returns {Promise<Object>} Company info and source info
   */
  getCompanyInfo: async (symbol, sourcePriority = DEFAULT_PRIORITY) => {
    // Try sources in priority order
    for (const sourceKey of sourcePriority) {
      const source = dataSources[sourceKey];
      
      if (!source || (source.isAvailable && !source.isAvailable())) {
        continue;
      }
      
      // Check if the source has the method
      if (!source.getCompanyOverview && !source.getFundamentalData) {
        continue;
      }
      
      try {
        let data;
        
        if (source.getCompanyOverview) {
          data = await source.getCompanyOverview(symbol);
        } else if (source.getFundamentalData) {
          data = await source.getFundamentalData(symbol);
        }
        
        return {
          data,
          source: {
            id: sourceKey,
            name: getSourceName(sourceKey)
          }
        };
      } catch (error) {
        console.warn(`Failed to get company info from ${sourceKey} for ${symbol}:`, error.message);
        // Continue to next source
      }
    }
    
    // If we get here, all sources failed
    throw new Error(`Could not retrieve company information for ${symbol} from any available source`);
  },
  
  /**
   * Search for symbols across multiple data sources
   * @param {string} query Search query
   * @param {Array} sourcePriority Priority order for data sources
   * @returns {Promise<Object>} Search results and source info
   */
  searchSymbols: async (query, sourcePriority = DEFAULT_PRIORITY) => {
    const results = {};
    const allResults = [];
    
    // Try to get data from each source
    for (const sourceKey of sourcePriority) {
      const source = dataSources[sourceKey];
      
      if (!source || (source.isAvailable && !source.isAvailable()) || !source.searchSymbols) {
        continue;
      }
      
      try {
        const data = await source.searchSymbols(query);
        results[sourceKey] = data;
        
        // Add source info to each result
        data.forEach(item => {
          allResults.push({
            ...item,
            source: {
              id: sourceKey,
              name: getSourceName(sourceKey)
            }
          });
        });
      } catch (error) {
        console.warn(`Failed to search symbols from ${sourceKey} for "${query}":`, error.message);
        // Continue to next source
      }
    }
    
    // If we have no results, return empty array
    if (allResults.length === 0) {
      return { results: [] };
    }
    
    // Remove duplicates (same symbol)
    const uniqueResults = [];
    const seen = new Set();
    
    for (const result of allResults) {
      if (!seen.has(result.symbol)) {
        seen.add(result.symbol);
        uniqueResults.push(result);
      }
    }
    
    return { results: uniqueResults };
  }
};

// Helper function to get friendly source name
function getSourceName(sourceKey) {
  const sourceNames = {
    eod: 'EOD Historical Data',
    alphavantage: 'Alpha Vantage'
  };
  
  return sourceNames[sourceKey] || sourceKey;
}

export default dataSourceManager;

// EDGAR SERVICE - NOW POWERED BY FMP FOR RELIABLE DATA
// This wrapper ensures compatibility with existing code while providing accurate data from FMP

import fmpService from './fmpService.js';

class EdgarService {
  constructor() {
    console.log('📊 Edgar Service initialized with FMP backend');
  }

  // Main method used by the dashboard - now uses FMP
  async getCompanyFacts(ticker) {
    console.log(`📊 Getting financial data for ${ticker} via FMP...`);
    
    try {
      // Get clean data from FMP service
      const cleanData = await fmpService.getCompanyFacts(ticker);
      
      console.log(`✅ Data retrieved successfully for ${ticker}`);
      console.log(`📈 Revenue: ${cleanData.fundamentals.latest.revenue?.quarterlyFormatted || 'N/A'}`);
      console.log(`💰 Net Income: ${cleanData.fundamentals.latest.netIncome?.quarterlyFormatted || 'N/A'}`);
      console.log(`📊 Data Quality: ${cleanData.dataQuality.status}`);
      
      return cleanData;
      
    } catch (error) {
      console.error(`❌ Error getting data for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Get company filings information
  async getCompanyFilings(ticker, formTypes = ['10-K', '10-Q']) {
    try {
      return await fmpService.getCompanyFilings(ticker, formTypes);
    } catch (error) {
      console.error(`Error getting filings for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Get insider transactions
  async getInsiderTransactions(ticker) {
    try {
      return await fmpService.getInsiderTransactions(ticker);
    } catch (error) {
      console.error(`Error getting insider transactions for ${ticker}:`, error.message);
      return { ticker, insiderFilings: [] };
    }
  }

  // Search for companies
  async searchCompanies(query) {
    try {
      return await fmpService.searchCompanies(query);
    } catch (error) {
      console.error(`Error searching companies with query "${query}":`, error.message);
      return [];
    }
  }

  // Get company CIK
  async getCompanyCIK(ticker) {
    try {
      return await fmpService.getCompanyCIK(ticker);
    } catch (error) {
      console.error(`Error getting CIK for ${ticker}:`, error.message);
      return '0000000000';
    }
  }

  // Test the service connectivity
  async testService() {
    try {
      console.log('🔍 Testing Edgar Service (FMP backend)...');
      return await fmpService.testConnection();
    } catch (error) {
      throw error;
    }
  }

  // Debug method to test data quality
  async debugCompanyData(ticker) {
    console.log(`\n🔍 Debugging Edgar Service data for ${ticker}...`);
    console.log('📡 Backend: Financial Modeling Prep API');
    
    try {
      const data = await fmpService.debugCompanyData(ticker);
      
      console.log('\n✅ Edgar Service Debug Summary:');
      console.log(`🏢 Company: ${data.companyName}`);
      console.log(`📊 Data Quality: ${data.dataQuality.status} (${(data.dataQuality.score * 100).toFixed(1)}%)`);
      console.log(`🔗 Data Source: ${data.dataSource}`);
      
      return data;
      
    } catch (error) {
      console.error(`❌ Edgar Service debug failed for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async getFinancialSummary(ticker) {
    try {
      const data = await this.getCompanyFacts(ticker);
      
      return {
        company: {
          ticker: data.ticker,
          name: data.companyName
        },
        metrics: data.fundamentals.latest,
        quality: data.dataQuality,
        lastUpdated: data.lastUpdated,
        source: 'FMP'
      };
      
    } catch (error) {
      throw new Error(`Failed to get financial summary for ${ticker}: ${error.message}`);
    }
  }

  // Additional utility methods
  formatCurrency(value) {
    return fmpService.formatCurrency(value);
  }

  // Health check method
  async healthCheck() {
    try {
      const testResult = await this.testService();
      return {
        service: 'Edgar Service (FMP)',
        status: 'healthy',
        backend: 'Financial Modeling Prep',
        message: testResult.message,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Edgar Service (FMP)',
        status: 'unhealthy',
        backend: 'Financial Modeling Prep',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new EdgarService();

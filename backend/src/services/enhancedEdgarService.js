// ENHANCED EDGAR SERVICE - REDIRECTS TO PERPLEXITY-STYLE SERVICE
// Ensures all code paths use the accurate implementation

import perplexityEdgarService from '../perplexityEdgarService.js';

class EnhancedEdgarService {
  async getCompanyFacts(ticker) {
    console.log(`📡 Enhanced EDGAR redirecting to Perplexity-style service for ${ticker}...`);
    
    // Use the same wrapper as regular edgarService
    const { default: edgarService } = await import('../edgarService.js');
    return edgarService.getCompanyFacts(ticker);
  }

  // Other methods delegate to perplexity service
  async getCompanyFilings(ticker, formTypes) {
    const { default: edgarService } = await import('../edgarService.js');
    return edgarService.getCompanyFilings(ticker, formTypes);
  }

  async searchCompanies(query) {
    const { default: edgarService } = await import('../edgarService.js');
    return edgarService.searchCompanies(query);
  }

  async getCompanyCIK(ticker) {
    const { cik } = await perplexityEdgarService.getCompanyCIK(ticker);
    return cik;
  }
}

export default new EnhancedEdgarService();

// SYSTEMATIC DATA QUALITY VALIDATION
// Test the fixes across diverse stocks to ensure 100% confidence
// Run: node validate-data-quality.js

import edgarService from './src/services/edgarService.js';

// Diverse test portfolio covering different sectors, fiscal years, and data patterns
const TEST_PORTFOLIO = [
  // Tech sector
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology', fiscalYearEnd: 'September' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', fiscalYearEnd: 'January' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', fiscalYearEnd: 'June' },
  
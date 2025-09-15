/**
 * FMP SERVICE WITH EARNINGS SUPPORT - FIXED
 * Properly merges class instance methods with earnings methods
 */

import enhancedFmpService from './fmpServiceEnhanced.js';
import {
  getEarningsCallTranscripts,
  getEarningsTranscriptByQuarter,
  getEarningsCalendar,
  getComprehensiveEarningsAnalysis
} from './fmpEarningsExtension.js';

// Create a combined service object that properly binds class methods
const fmpService = {};

// Manually bind all methods from the enhanced service class instance
const proto = Object.getPrototypeOf(enhancedFmpService);
const methodNames = Object.getOwnPropertyNames(proto)
  .filter(name => name !== 'constructor' && typeof proto[name] === 'function');

// Bind each method to the service instance
methodNames.forEach(methodName => {
  fmpService[methodName] = enhancedFmpService[methodName].bind(enhancedFmpService);
});

// Also copy any properties directly on the instance
Object.keys(enhancedFmpService).forEach(key => {
  if (typeof enhancedFmpService[key] === 'function') {
    fmpService[key] = enhancedFmpService[key].bind(enhancedFmpService);
  } else {
    fmpService[key] = enhancedFmpService[key];
  }
});

// Add earnings methods
fmpService.getEarningsCallTranscripts = getEarningsCallTranscripts;
fmpService.getEarningsTranscriptByQuarter = getEarningsTranscriptByQuarter;
fmpService.getEarningsCalendar = getEarningsCalendar;
fmpService.getComprehensiveEarningsAnalysis = getComprehensiveEarningsAnalysis;

// Add core methods (quote, batch quotes, movers)
import { 
  getQuote, 
  getQuoteBatch, 
  getGainers, 
  getLosers, 
  getActives 
} from './fmpCoreMethods.js';

fmpService.getQuote = getQuote;
fmpService.getQuoteBatch = getQuoteBatch;
fmpService.getGainers = getGainers;
fmpService.getLosers = getLosers;
fmpService.getActives = getActives;

// Export as default
export default fmpService;

// Also export named for compatibility
export { fmpService };

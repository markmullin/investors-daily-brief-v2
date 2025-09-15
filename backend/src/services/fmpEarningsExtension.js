/**
 * FMP Earnings Transcript Extension - REAL DATA ONLY
 * No mock data, no fallbacks - actual FMP transcripts
 */

import axios from 'axios';
import { redis as redisWrapper } from '../config/database.js';

const FMP_API_KEY = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api';

/**
 * Get REAL earnings call transcripts from FMP
 */
export async function getEarningsCallTranscripts(symbol, limit = 12) {
  try {
    const cacheKey = `fmp:earnings_transcripts:${symbol}:${limit}`;
    
    // Check cache first
    if (redisWrapper && redisWrapper.isConnected()) {
      const cached = await redisWrapper.get(cacheKey);
      if (cached) {
        console.log(`📦 [FMP] Using cached transcripts for ${symbol}`);
        return JSON.parse(cached);
      }
    }

    console.log(`🔍 [FMP] Fetching REAL earnings transcripts for ${symbol}...`);

    // CORRECT FMP endpoint for earnings transcripts
    const url = `${FMP_BASE_URL}/v3/earning_call_transcript/${symbol}`;
    
    console.log(`🌐 [FMP] Calling: ${url}`);
    
    const response = await axios.get(url, {
      params: {
        apikey: FMP_API_KEY,
        limit: limit
      }
    });

    console.log(`📊 [FMP] Response status: ${response.status}`);
    console.log(`📊 [FMP] Response data type: ${typeof response.data}`);
    console.log(`📊 [FMP] Is array: ${Array.isArray(response.data)}`);

    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.log(`⚠️ [FMP] No transcripts found for ${symbol}`);
      return [];
    }

    let transcripts = [];
    
    // Handle both array and object responses
    if (Array.isArray(response.data)) {
      transcripts = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Single transcript returned as object
      transcripts = [response.data];
    }

    console.log(`✅ [FMP] Found ${transcripts.length} REAL transcripts for ${symbol}`);

    // Process REAL transcripts with proper formatting
    const processedTranscripts = transcripts.map((transcript, index) => {
      console.log(`📝 Processing transcript ${index + 1}:`, {
        date: transcript.date,
        quarter: transcript.quarter,
        year: transcript.year,
        hasContent: !!transcript.content,
        contentLength: transcript.content ? transcript.content.length : 0
      });

      // Parse the date properly
      const date = new Date(transcript.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      // Calculate quarter from date
      let quarter;
      if (month <= 3) quarter = 1;
      else if (month <= 6) quarter = 2;
      else if (month <= 9) quarter = 3;
      else quarter = 4;
      
      return {
        symbol: transcript.symbol || symbol,
        date: transcript.date,
        year: year,
        quarter: quarter,
        period: `Q${quarter}`,
        title: `Q${quarter} ${year} Earnings Call`,
        content: transcript.content || '',
        fullContent: transcript.content || '', // Include full content for frontend
        hasTranscript: !!transcript.content,
        contentLength: transcript.content ? transcript.content.length : 0,
        summary: transcript.content ? transcript.content.substring(0, 500) + '...' : '',
        topics: extractTopics(transcript.content || '')
      };
    });

    // Sort by date descending (most recent first)
    processedTranscripts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Cache for 1 hour
    if (redisWrapper && redisWrapper.isConnected()) {
      await redisWrapper.setex(cacheKey, 3600, JSON.stringify(processedTranscripts));
    }

    return processedTranscripts;
  } catch (error) {
    console.error(`❌ [FMP] Error fetching REAL transcripts for ${symbol}:`, error.message);
    if (error.response) {
      console.error(`❌ [FMP] Response status: ${error.response.status}`);
      console.error(`❌ [FMP] Response data:`, error.response.data);
    }
    // Return empty array - NO FALLBACK
    return [];
  }
}

/**
 * Extract topics from transcript content
 */
function extractTopics(content) {
  if (!content) return [];
  
  const topics = [];
  const lowerContent = content.toLowerCase();
  
  // Common earnings topics to look for
  const topicPatterns = [
    { pattern: /revenue|sales/, topic: 'revenue' },
    { pattern: /margin|profitability/, topic: 'margins' },
    { pattern: /guidance|outlook|forecast/, topic: 'guidance' },
    { pattern: /cloud|saas/, topic: 'cloud' },
    { pattern: /ai|artificial intelligence|machine learning/, topic: 'AI' },
    { pattern: /growth/, topic: 'growth' },
    { pattern: /cash flow/, topic: 'cash flow' },
    { pattern: /dividend/, topic: 'dividend' },
    { pattern: /acquisition|merger/, topic: 'M&A' },
    { pattern: /supply chain/, topic: 'supply chain' }
  ];
  
  topicPatterns.forEach(({ pattern, topic }) => {
    if (pattern.test(lowerContent)) {
      topics.push(topic);
    }
  });
  
  return topics.slice(0, 5); // Return top 5 topics
}

/**
 * Get specific quarter transcript - REAL DATA
 */
export async function getEarningsTranscriptByQuarter(symbol, quarter, year) {
  try {
    // Get all transcripts
    const transcripts = await getEarningsCallTranscripts(symbol, 20);
    
    // Find the specific quarter
    const transcript = transcripts.find(t => {
      return t.quarter === quarter && t.year === year;
    });
    
    if (!transcript) {
      console.log(`⚠️ [FMP] No REAL transcript found for ${symbol} Q${quarter} ${year}`);
      return null;
    }
    
    return transcript;
  } catch (error) {
    console.error(`❌ [FMP] Error fetching transcript for ${symbol} Q${quarter} ${year}:`, error.message);
    return null;
  }
}

/**
 * Get earnings calendar (next earnings date) - REAL DATA
 */
export async function getEarningsCalendar(symbol) {
  try {
    const url = `${FMP_BASE_URL}/v3/earnings-calendar`;
    
    console.log(`📅 [FMP] Getting earnings calendar for ${symbol}`);
    
    const response = await axios.get(url, {
      params: {
        apikey: FMP_API_KEY,
        symbol: symbol
      }
    });

    const data = response.data || [];
    console.log(`📅 [FMP] Found ${data.length} earnings dates for ${symbol}`);
    
    return data;
  } catch (error) {
    console.error(`❌ [FMP] Error fetching earnings calendar for ${symbol}:`, error.message);
    return [];
  }
}

/**
 * Get comprehensive earnings analysis data - REAL DATA ONLY
 */
export async function getComprehensiveEarningsAnalysis(symbol) {
  try {
    console.log(`📊 [FMP] Getting comprehensive REAL earnings data for ${symbol}...`);
    
    // Fetch multiple data points in parallel
    const [transcripts, calendar, estimates] = await Promise.all([
      getEarningsCallTranscripts(symbol, 12),
      getEarningsCalendar(symbol),
      getAnalystEstimates(symbol)
    ]);
    
    console.log(`📊 [FMP] Comprehensive data retrieved:`, {
      transcripts: transcripts.length,
      nextEarnings: calendar.length > 0,
      estimates: estimates.length
    });
    
    return {
      symbol,
      transcripts,
      nextEarningsDate: calendar[0]?.date || null,
      analystEstimates: estimates
    };
  } catch (error) {
    console.error(`❌ [FMP] Comprehensive earnings analysis failed for ${symbol}:`, error);
    return {
      symbol,
      transcripts: [],
      nextEarningsDate: null,
      analystEstimates: []
    };
  }
}

/**
 * Get analyst estimates - REAL DATA
 */
async function getAnalystEstimates(symbol) {
  try {
    const url = `${FMP_BASE_URL}/v3/analyst-estimates/${symbol}`;
    
    console.log(`📈 [FMP] Getting analyst estimates for ${symbol}`);
    
    const response = await axios.get(url, {
      params: {
        apikey: FMP_API_KEY,
        limit: 4
      }
    });

    const data = response.data || [];
    console.log(`📈 [FMP] Found ${data.length} analyst estimates for ${symbol}`);
    
    return data;
  } catch (error) {
    console.error(`❌ [FMP] Error fetching analyst estimates for ${symbol}:`, error.message);
    return [];
  }
}

// Export the functions to be added to the main FMP service
export default {
  getEarningsCallTranscripts,
  getEarningsTranscriptByQuarter,
  getEarningsCalendar,
  getComprehensiveEarningsAnalysis
};

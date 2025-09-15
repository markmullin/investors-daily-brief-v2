/**
 * Debug script to check what FMP is actually returning
 */

import 'dotenv/config';
import fetch from 'node-fetch';

const FMP_API_KEY = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
const symbol = 'AVGO';

async function debugEarningsData() {
  console.log('\n=== DEBUGGING EARNINGS DATA FOR AVGO ===\n');
  
  // 1. Check raw FMP earnings transcripts
  const url = `https://financialmodelingprep.com/api/v3/earning_call_transcript/${symbol}?apikey=${FMP_API_KEY}`;
  
  try {
    console.log('Fetching from FMP:', url);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} transcripts\n`);
      
      // Show first 6 transcripts
      console.log('First 6 transcripts from FMP:');
      console.log('--------------------------------');
      data.slice(0, 6).forEach((transcript, i) => {
        console.log(`\nTranscript ${i + 1}:`);
        console.log(`  Symbol: ${transcript.symbol}`);
        console.log(`  Date: ${transcript.date}`);
        console.log(`  Quarter: ${transcript.quarter}`);
        console.log(`  Year: ${transcript.year}`);
        
        // Check if quarter/year are all the same
        if (i === 0) {
          global.firstQuarter = transcript.quarter;
          global.firstYear = transcript.year;
        }
      });
      
      // Check if all quarters are the same
      const allSameQuarter = data.slice(0, 6).every(t => t.quarter === global.firstQuarter && t.year === global.firstYear);
      
      if (allSameQuarter) {
        console.log('\n⚠️ WARNING: FMP is returning the SAME quarter/year for all transcripts!');
        console.log('This is a data issue from FMP, not our code.');
        console.log('\nWe need to calculate quarters from the dates instead.');
      }
      
      // Show how we can fix it by using dates
      console.log('\n🔧 SOLUTION: Calculate quarters from dates:');
      console.log('----------------------------------------');
      data.slice(0, 6).forEach((transcript, i) => {
        const date = new Date(transcript.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        
        console.log(`Transcript ${i + 1}: ${transcript.date} → Q${quarter} ${year}`);
      });
      
    } else {
      console.log('No transcripts found');
    }
    
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
  
  process.exit(0);
}

debugEarningsData();

/**
 * Stock Analysis Script
 * Uses Puppeteer to analyze a stock page and extract key metrics and sentiment
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', '..', 'data');

// Ensure the data directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Analyze a stock using Yahoo Finance
 * @param {String} symbol - Stock symbol
 * @returns {Promise<Object>} Stock analysis data
 */
async function analyzeStock(symbol) {
  console.log(`Analyzing stock: ${symbol}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to Yahoo Finance page for the stock
    const url = `https://finance.yahoo.com/quote/${symbol}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Take a screenshot
    await page.screenshot({ path: path.join(outputDir, `${symbol}-analysis.png`) });
    
    // Extract key metrics
    const metrics = await page.evaluate((symbol) => {
      const result = {
        symbol,
        name: '',
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        peRatio: null,
        marketCap: null,
        beta: null,
        dividend: null,
        eps: null,
        averageVolume: null,
        metrics: {},
        stats: {}
      };
      
      // Get the company name
      const nameElement = document.querySelector('h1');
      if (nameElement) {
        result.name = nameElement.textContent.trim();
      }
      
      // Get the current price
      const priceElement = document.querySelector(`[data-symbol="${symbol}"] [data-field="regularMarketPrice"]`);
      if (priceElement) {
        result.price = parseFloat(priceElement.textContent.replace(/[^\d.-]/g, ''));
      }
      
      // Get price change
      const changeElement = document.querySelector(`[data-symbol="${symbol}"] [data-field="regularMarketChange"]`);
      if (changeElement) {
        result.change = parseFloat(changeElement.textContent.replace(/[^\d.-]/g, ''));
      }
      
      // Get price change percentage
      const changePercentElement = document.querySelector(`[data-symbol="${symbol}"] [data-field="regularMarketChangePercent"]`);
      if (changePercentElement) {
        const percentText = changePercentElement.textContent.replace(/[^\d.-]/g, '');
        result.changePercent = parseFloat(percentText);
      }
      
      // Get volume
      const volumeElement = document.querySelector(`[data-field="regularMarketVolume"]`);
      if (volumeElement) {
        const volumeText = volumeElement.textContent;
        // Parse volume like "12.5M" to a number
        const volumeMatch = volumeText.match(/^([\d,.]+)([KMB])?$/);
        if (volumeMatch) {
          let volume = parseFloat(volumeMatch[1].replace(/,/g, ''));
          if (volumeMatch[2]) {
            volume *= volumeMatch[2] === 'K' ? 1000 : volumeMatch[2] === 'M' ? 1000000 : 1000000000;
          }
          result.volume = volume;
        }
      }
      
      // Extract metrics from the summary table
      const summaryRows = document.querySelectorAll('table[data-test="summary-table"] tr');
      summaryRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          
          // Store as metrics
          result.metrics[label] = value;
          
          // Also store specific metrics we're interested in
          if (label.includes('P/E')) {
            result.peRatio = parseFloat(value);
          } else if (label.includes('Market Cap')) {
            result.marketCap = value;
          } else if (label.includes('Beta')) {
            result.beta = parseFloat(value);
          } else if (label.includes('Forward Dividend')) {
            result.dividend = value;
          } else if (label.includes('EPS')) {
            result.eps = parseFloat(value);
          } else if (label.includes('Avg. Volume')) {
            // Parse volume like "12.5M" to a number
            const volumeMatch = value.match(/^([\d,.]+)([KMB])?$/);
            if (volumeMatch) {
              let volume = parseFloat(volumeMatch[1].replace(/,/g, ''));
              if (volumeMatch[2]) {
                volume *= volumeMatch[2] === 'K' ? 1000 : volumeMatch[2] === 'M' ? 1000000 : 1000000000;
              }
              result.averageVolume = volume;
            }
          }
        }
      });
      
      return result;
    }, symbol);
    
    // Get analyst recommendations and ratings
    await page.goto(`https://finance.yahoo.com/quote/${symbol}/analysis`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Extract analyst data
    const analystData = await page.evaluate(() => {
      const result = {
        recommendations: {},
        targetPrice: null,
        earningsEstimates: [],
        revenueEstimates: []
      };
      
      // Get analyst recommendations
      const recTable = document.querySelector('table.W\\(100\\%\\)');
      if (recTable) {
        const rows = recTable.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const rating = cells[0].textContent.trim();
            const count = parseInt(cells[1].textContent.trim());
            result.recommendations[rating] = count;
          }
        });
      }
      
      // Get target price
      const targetPriceElements = document.querySelectorAll('section span');
      for (const element of targetPriceElements) {
        if (element.textContent.includes('Average Price Target')) {
          const targetPriceText = element.nextElementSibling?.textContent;
          if (targetPriceText) {
            result.targetPrice = parseFloat(targetPriceText.replace(/[^\d.-]/g, ''));
          }
          break;
        }
      }
      
      // Get earnings estimates
      const earningsTables = document.querySelectorAll('table');
      for (const table of earningsTables) {
        const headerCell = table.querySelector('th');
        if (headerCell && headerCell.textContent.includes('Earnings Estimate')) {
          const rows = table.querySelectorAll('tr');
          rows.forEach((row, index) => {
            if (index === 0) return; // Skip header
            
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
              const period = cells[0].textContent.trim();
              const avg = parseFloat(cells[1].textContent.replace(/[^\d.-]/g, ''));
              const low = parseFloat(cells[2].textContent.replace(/[^\d.-]/g, ''));
              const high = parseFloat(cells[3].textContent.replace(/[^\d.-]/g, ''));
              const yearAgo = parseFloat(cells[4].textContent.replace(/[^\d.-]/g, ''));
              
              result.earningsEstimates.push({ period, avg, low, high, yearAgo });
            }
          });
          break;
        }
      }
      
      return result;
    });
    
    // Combine metrics and analyst data
    const analysis = {
      ...metrics,
      analyst: analystData,
      fetchedAt: new Date().toISOString()
    };
    
    // Calculate a sentiment score based on analyst recommendations
    if (analystData.recommendations) {
      let totalScore = 0;
      let totalRatings = 0;
      
      // Assign weights to different ratings
      const weights = {
        'Strong Buy': 2,
        'Buy': 1,
        'Hold': 0,
        'Underperform': -1,
        'Sell': -2
      };
      
      // Calculate weighted score
      Object.entries(analystData.recommendations).forEach(([rating, count]) => {
        if (weights[rating] !== undefined && count) {
          totalScore += weights[rating] * count;
          totalRatings += count;
        }
      });
      
      if (totalRatings > 0) {
        // Normalize score to 0-1 range
        analysis.sentimentScore = (totalScore / totalRatings + 2) / 4;
        
        // Add interpretation
        if (analysis.sentimentScore > 0.75) {
          analysis.sentiment = 'Bullish';
        } else if (analysis.sentimentScore > 0.5) {
          analysis.sentiment = 'Somewhat Bullish';
        } else if (analysis.sentimentScore > 0.25) {
          analysis.sentiment = 'Somewhat Bearish';
        } else {
          analysis.sentiment = 'Bearish';
        }
      }
    }
    
    // Save to file
    const outputFile = path.join(outputDir, `${symbol}-analysis.json`);
    fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));
    
    console.log(`Analysis for ${symbol} saved to ${outputFile}`);
    
    return analysis;
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Process command line arguments
const symbol = process.argv[2] || 'AAPL';

// Run the analysis
analyzeStock(symbol)
  .then(analysis => {
    console.log('Analysis summary:');
    console.log(`Symbol: ${analysis.symbol}`);
    console.log(`Name: ${analysis.name}`);
    console.log(`Price: $${analysis.price}`);
    console.log(`Change: ${analysis.change > 0 ? '+' : ''}${analysis.change} (${analysis.changePercent}%)`);
    console.log(`Sentiment: ${analysis.sentiment || 'Unknown'} (${(analysis.sentimentScore || 0) * 100}%)`);
    console.log('Analysis completed.');
  })
  .catch(error => {
    console.error('Analysis failed:', error.message);
    process.exit(1);
  });
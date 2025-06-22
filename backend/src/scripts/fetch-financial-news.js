/**
 * News Scraper Script
 * Uses Puppeteer to fetch real-time financial news from popular sources
 */

// Import required modules
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the sources to scrape
const newsSources = [
  {
    name: 'CNBC Markets',
    url: 'https://www.cnbc.com/markets/',
    selectors: {
      articles: '.Card-titleContainer',
      title: '.Card-title',
      link: 'a.Card-title'
    }
  },
  {
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/',
    selectors: {
      articles: 'li.js-stream-content',
      title: 'h3',
      link: 'a'
    }
  },
  {
    name: 'MarketWatch',
    url: 'https://www.marketwatch.com/latest-news',
    selectors: {
      articles: '.article__content',
      title: '.article__headline',
      link: 'a.link'
    }
  }
];

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', '..', 'data');
const outputFile = path.join(outputDir, 'latest-news.json');

// Ensure the data directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Fetch news from a specific source
 * @param {Object} source - News source configuration
 * @param {Object} browser - Puppeteer browser instance
 * @returns {Promise<Array>} Array of news articles
 */
async function fetchNewsFromSource(source, browser) {
  console.log(`Fetching news from ${source.name}...`);
  
  const page = await browser.newPage();
  
  // Set viewport and user agent
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    // Navigate to the page
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for articles to load
    await page.waitForSelector(source.selectors.articles, { timeout: 10000 });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: path.join(outputDir, `${source.name.toLowerCase().replace(/\s+/g, '-')}.png`) });
    
    // Extract news articles
    const articles = await page.evaluate((selectors) => {
      const articleElements = document.querySelectorAll(selectors.articles);
      const articles = [];
      
      articleElements.forEach((element, index) => {
        if (index >= 10) return; // Limit to 10 articles per source
        
        const titleElement = element.querySelector(selectors.title);
        const linkElement = element.querySelector(selectors.link);
        
        if (titleElement && linkElement) {
          articles.push({
            title: titleElement.textContent.trim(),
            url: linkElement.href
          });
        }
      });
      
      return articles;
    }, source.selectors);
    
    // Add source information
    const processedArticles = articles.map(article => ({
      ...article,
      source: source.name,
      fetchedAt: new Date().toISOString()
    }));
    
    console.log(`Found ${processedArticles.length} articles from ${source.name}`);
    return processedArticles;
  } catch (error) {
    console.error(`Error fetching news from ${source.name}:`, error.message);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Main function to fetch news from all sources
 */
async function fetchAllNews() {
  console.log('Starting news fetch...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Fetch news from all sources in parallel
    const newsPromises = newsSources.map(source => fetchNewsFromSource(source, browser));
    const results = await Promise.allSettled(newsPromises);
    
    // Collect all articles
    const allArticles = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      } else {
        console.error(`Failed to fetch news from ${newsSources[index].name}:`, result.reason);
      }
    });
    
    // Save the articles to a file
    fs.writeFileSync(outputFile, JSON.stringify({
      fetchedAt: new Date().toISOString(),
      articles: allArticles
    }, null, 2));
    
    console.log(`Saved ${allArticles.length} articles to ${outputFile}`);
  } catch (error) {
    console.error('Error fetching news:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the script
fetchAllNews()
  .then(() => console.log('News fetch completed'))
  .catch(error => console.error('News fetch failed:', error.message));
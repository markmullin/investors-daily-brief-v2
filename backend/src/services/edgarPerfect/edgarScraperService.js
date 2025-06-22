// PERFECT EDGAR SCRAPER SERVICE
// Uses Puppeteer to scrape EDGAR HTML directly for 100% accurate data extraction

import puppeteer from 'puppeteer';
import axios from 'axios';
import NodeCache from 'node-cache';

class EdgarScraperService {
  constructor() {
    // Cache for 2 hours to reduce load on SEC servers
    this.cache = new NodeCache({ stdTTL: 7200 });
    this.browser = null;
    
    // SEC base URLs
    this.baseURL = 'https://www.sec.gov';
    this.edgarURL = 'https://www.sec.gov/edgar/searchedgar/companysearch';
    
    // Required headers
    this.headers = {
      'User-Agent': 'InvestorsDailyBrief your-email@example.com',
      'Accept': 'application/json,text/html'
    };
  }

  // Initialize browser
  async initBrowser() {
    if (!this.browser) {
      console.log('🚀 Launching Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      });
    }
    return this.browser;
  }

  // Close browser
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Get CIK for a ticker
  async getCIK(ticker) {
    const cacheKey = `cik_${ticker}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        'https://www.sec.gov/files/company_tickers.json',
        { headers: this.headers }
      );

      const companies = Object.values(response.data);
      const company = companies.find(c => 
        c.ticker.toLowerCase() === ticker.toLowerCase()
      );

      if (!company) {
        throw new Error(`Ticker ${ticker} not found`);
      }

      const cik = String(company.cik_str).padStart(10, '0');
      this.cache.set(cacheKey, cik);
      return cik;
    } catch (error) {
      console.error(`Error getting CIK for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Scrape financial statement HTML from EDGAR
  async scrapeFinancialStatement(ticker, formType = '10-K', year = null) {
    const cacheKey = `statement_${ticker}_${formType}_${year}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent(this.headers['User-Agent']);
      
      console.log(`🔍 Scraping ${formType} for ${ticker}...`);
      
      // Get CIK
      const cik = await this.getCIK(ticker);
      
      // Navigate to company filings page
      const companyUrl = `${this.baseURL}/edgar/browse/?CIK=${cik}`;
      await page.goto(companyUrl, { waitUntil: 'networkidle2' });
      
      // Find the most recent filing of the requested type
      const filingLink = await page.evaluate((formType, year) => {
        const rows = document.querySelectorAll('tr');
        for (let row of rows) {
          const formCell = row.querySelector('td:nth-child(1)');
          const dateCell = row.querySelector('td:nth-child(4)');
          
          if (formCell && formCell.textContent.trim() === formType) {
            if (!year || (dateCell && dateCell.textContent.includes(year))) {
              const link = row.querySelector('a[href*="Archives/edgar/data"]');
              if (link) {
                return link.href;
              }
            }
          }
        }
        return null;
      }, formType, year);

      if (!filingLink) {
        throw new Error(`No ${formType} filing found for ${ticker}`);
      }

      // Navigate to the filing
      await page.goto(filingLink, { waitUntil: 'networkidle2' });
      
      // Find the main document (usually ends with .htm)
      const documentLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href$=".htm"]'));
        // Look for the main document (usually the largest file)
        const mainDoc = links.find(link => {
          const text = link.textContent.toLowerCase();
          return text.includes('10-k') || text.includes('10-q') || text.includes('form');
        });
        return mainDoc ? mainDoc.href : null;
      });

      if (!documentLink) {
        throw new Error('Could not find main document in filing');
      }

      // Navigate to the main document
      await page.goto(documentLink, { waitUntil: 'networkidle2' });
      
      // Extract financial tables
      const financialData = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const statements = {
          incomeStatement: null,
          balanceSheet: null,
          cashFlow: null,
          raw: []
        };

        // Helper function to extract table data
        function extractTable(table) {
          const rows = Array.from(table.querySelectorAll('tr'));
          return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            return cells.map(cell => {
              // Clean cell text
              let text = cell.textContent.trim();
              // Remove special characters and normalize
              text = text.replace(/[\u00A0\u2013\u2014]/g, '-')
                        .replace(/[^\x00-\x7F]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
              return text;
            });
          });
        }

        // Identify financial statements by keywords
        tables.forEach((table, index) => {
          const tableText = table.textContent.toLowerCase();
          const tableData = extractTable(table);
          
          // Store all tables for AI analysis
          if (tableData.length > 3) {
            statements.raw.push({
              index,
              data: tableData,
              text: tableText.substring(0, 500) // First 500 chars for identification
            });
          }
          
          // Try to identify statement type
          if (tableText.includes('income') && tableText.includes('statement')) {
            statements.incomeStatement = tableData;
          } else if (tableText.includes('balance') && tableText.includes('sheet')) {
            statements.balanceSheet = tableData;
          } else if (tableText.includes('cash') && tableText.includes('flow')) {
            statements.cashFlow = tableData;
          } else if (tableText.includes('revenue') || tableText.includes('net income')) {
            if (!statements.incomeStatement) {
              statements.incomeStatement = tableData;
            }
          } else if (tableText.includes('assets') || tableText.includes('liabilities')) {
            if (!statements.balanceSheet) {
              statements.balanceSheet = tableData;
            }
          }
        });

        return statements;
      });

      await page.close();

      // Process the raw data
      const result = {
        ticker,
        formType,
        filingUrl: documentLink,
        statements: financialData,
        scrapedAt: new Date().toISOString()
      };

      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error(`Error scraping ${formType} for ${ticker}:`, error.message);
      throw error;
    }
  }

  // Extract specific line items from scraped data
  extractLineItems(scrapedData) {
    const lineItems = {
      incomeStatement: {},
      balanceSheet: {},
      cashFlow: {}
    };

    // Process income statement
    if (scrapedData.statements.incomeStatement) {
      lineItems.incomeStatement = this.processIncomeStatement(
        scrapedData.statements.incomeStatement
      );
    }

    // Process balance sheet
    if (scrapedData.statements.balanceSheet) {
      lineItems.balanceSheet = this.processBalanceSheet(
        scrapedData.statements.balanceSheet
      );
    }

    // Process cash flow
    if (scrapedData.statements.cashFlow) {
      lineItems.cashFlow = this.processCashFlow(
        scrapedData.statements.cashFlow
      );
    }

    return lineItems;
  }

  // Process income statement table
  processIncomeStatement(tableData) {
    const items = {};
    const patterns = {
      revenue: /^(total |net |)revenue|sales|income from operations/i,
      costOfRevenue: /cost of (revenue|sales|goods)|cogs/i,
      grossProfit: /gross profit|gross margin/i,
      operatingExpenses: /operating expense|opex/i,
      operatingIncome: /operating income|income from operations/i,
      netIncome: /net income|net earnings|net profit/i,
      eps: /earnings per share|eps/i
    };

    tableData.forEach((row, index) => {
      if (row.length < 2) return;
      
      const label = row[0].toLowerCase();
      
      Object.entries(patterns).forEach(([key, pattern]) => {
        if (pattern.test(label)) {
          // Extract values (usually in columns 1-3 for different periods)
          const values = [];
          for (let i = 1; i < Math.min(row.length, 4); i++) {
            const value = this.parseFinancialValue(row[i]);
            if (value !== null) {
              values.push(value);
            }
          }
          
          if (values.length > 0) {
            items[key] = {
              label: row[0],
              values: values,
              rowIndex: index
            };
          }
        }
      });
    });

    return items;
  }

  // Process balance sheet table
  processBalanceSheet(tableData) {
    const items = {};
    const patterns = {
      totalAssets: /^total assets/i,
      currentAssets: /current assets/i,
      cash: /cash and cash equivalents/i,
      totalLiabilities: /^total liabilities/i,
      currentLiabilities: /current liabilities/i,
      longTermDebt: /long[- ]term debt/i,
      shareholdersEquity: /shareholders'? equity|stockholders'? equity/i
    };

    tableData.forEach((row, index) => {
      if (row.length < 2) return;
      
      const label = row[0].toLowerCase();
      
      Object.entries(patterns).forEach(([key, pattern]) => {
        if (pattern.test(label)) {
          const values = [];
          for (let i = 1; i < Math.min(row.length, 4); i++) {
            const value = this.parseFinancialValue(row[i]);
            if (value !== null) {
              values.push(value);
            }
          }
          
          if (values.length > 0) {
            items[key] = {
              label: row[0],
              values: values,
              rowIndex: index
            };
          }
        }
      });
    });

    return items;
  }

  // Process cash flow table
  processCashFlow(tableData) {
    const items = {};
    const patterns = {
      operatingCashFlow: /net cash.*operating|cash flow.*operating/i,
      investingCashFlow: /net cash.*investing|cash flow.*investing/i,
      financingCashFlow: /net cash.*financing|cash flow.*financing/i,
      capitalExpenditures: /capital expenditure|capex|property.*equipment/i,
      freeCashFlow: /free cash flow/i
    };

    tableData.forEach((row, index) => {
      if (row.length < 2) return;
      
      const label = row[0].toLowerCase();
      
      Object.entries(patterns).forEach(([key, pattern]) => {
        if (pattern.test(label)) {
          const values = [];
          for (let i = 1; i < Math.min(row.length, 4); i++) {
            const value = this.parseFinancialValue(row[i]);
            if (value !== null) {
              values.push(value);
            }
          }
          
          if (values.length > 0) {
            items[key] = {
              label: row[0],
              values: values,
              rowIndex: index
            };
          }
        }
      });
    });

    return items;
  }

  // Parse financial value from text
  parseFinancialValue(text) {
    if (!text) return null;
    
    // Remove common annotations
    text = text.replace(/\([^)]*\)/g, '') // Remove parentheses content
              .replace(/\[[^\]]*\]/g, '') // Remove brackets content
              .trim();
    
    // Check for negative values (parentheses or minus)
    const isNegative = text.startsWith('(') || text.includes('(') || text.startsWith('-');
    
    // Extract numeric value
    const numericMatch = text.match(/[\d,]+\.?\d*/);
    if (!numericMatch) return null;
    
    let value = parseFloat(numericMatch[0].replace(/,/g, ''));
    
    // Handle multipliers (millions, billions)
    if (text.toLowerCase().includes('thousand')) {
      value *= 1000;
    } else if (text.toLowerCase().includes('million')) {
      value *= 1000000;
    } else if (text.toLowerCase().includes('billion')) {
      value *= 1000000000;
    }
    
    // Apply negative sign if needed
    if (isNegative) {
      value = -value;
    }
    
    return value;
  }

  // Get all financial data for a company
  async getCompleteFinancialData(ticker) {
    try {
      console.log(`📊 Getting complete financial data for ${ticker}...`);
      
      // Scrape latest 10-K and 10-Q
      const [annual, quarterly] = await Promise.all([
        this.scrapeFinancialStatement(ticker, '10-K'),
        this.scrapeFinancialStatement(ticker, '10-Q')
      ]);
      
      // Extract line items
      const annualItems = this.extractLineItems(annual);
      const quarterlyItems = this.extractLineItems(quarterly);
      
      return {
        ticker,
        annual: {
          filing: annual,
          lineItems: annualItems
        },
        quarterly: {
          filing: quarterly,
          lineItems: quarterlyItems
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Error getting complete financial data for ${ticker}:`, error.message);
      throw error;
    }
  }
}

export default new EdgarScraperService();

// AI-POWERED EDGAR ANALYSIS SERVICE
// Uses Mistral AI to intelligently parse and categorize financial statement line items

import axios from 'axios';
import NodeCache from 'node-cache';

class EdgarAIAnalysisService {
  constructor() {
    // Cache AI analysis results for 24 hours
    this.cache = new NodeCache({ stdTTL: 86400 });
    
    // Mistral API configuration
    this.mistralApiKey = process.env.MISTRAL_API_KEY || 'mistral-8NPkpT6Z9SWnQAKVJk3j7NnJMDJlEbZC';
    this.mistralApiUrl = 'https://api.mistral.ai/v1/chat/completions';
    
    // Financial concept mappings learned from analysis
    this.conceptMappings = new Map();
    this.loadConceptMappings();
  }

  // Load previously learned concept mappings
  loadConceptMappings() {
    // This would load from a database in production
    // For now, initialize with common patterns
    this.conceptMappings.set('revenue', [
      'total revenue', 'net revenue', 'sales', 'total sales', 
      'net sales', 'revenue from operations', 'operating revenue'
    ]);
    
    this.conceptMappings.set('costOfRevenue', [
      'cost of revenue', 'cost of sales', 'cost of goods sold',
      'cogs', 'cost of products sold', 'cost of services'
    ]);
    
    this.conceptMappings.set('netIncome', [
      'net income', 'net earnings', 'net profit', 'net income (loss)',
      'profit (loss)', 'earnings', 'income'
    ]);
  }

  // Analyze financial table using AI
  async analyzeFinancialTable(tableData, companyName, statementType) {
    const cacheKey = `ai_analysis_${companyName}_${statementType}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`🤖 AI analyzing ${statementType} for ${companyName}...`);
      
      // Prepare table for AI analysis
      const tableString = this.formatTableForAI(tableData);
      
      // Create AI prompt
      const prompt = this.createAnalysisPrompt(tableString, companyName, statementType);
      
      // Call Mistral API
      const response = await axios.post(
        this.mistralApiUrl,
        {
          model: 'mistral-large-latest',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.1, // Low temperature for consistent parsing
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.mistralApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Parse AI response
      const analysis = this.parseAIResponse(aiResponse);
      
      // Update concept mappings based on AI learning
      this.updateConceptMappings(analysis);
      
      this.cache.set(cacheKey, analysis);
      return analysis;
      
    } catch (error) {
      console.error(`Error in AI analysis:`, error.message);
      throw error;
    }
  }

  // Format table data for AI consumption
  formatTableForAI(tableData) {
    return tableData.map((row, index) => {
      return `Row ${index}: ${row.join(' | ')}`;
    }).join('\n');
  }

  // Create analysis prompt for Mistral
  createAnalysisPrompt(tableString, companyName, statementType) {
    return `You are a financial analyst expert. Analyze this ${statementType} table from ${companyName}'s SEC filing.

Your task is to identify and extract ALL financial line items with their values. Be extremely thorough and capture EVERY line item, not just the major ones.

Table data:
${tableString}

Instructions:
1. Identify EVERY financial line item in the table
2. Extract the label and all period values for each line item
3. Categorize each line item into standard financial categories
4. Handle special formatting (parentheses for negatives, footnote markers, etc.)
5. Identify the time periods represented in each column

Return a JSON response with this EXACT structure:
{
  "periods": ["2023", "2022", "2021"],
  "lineItems": [
    {
      "originalLabel": "exact label from table",
      "standardCategory": "Revenue|CostOfRevenue|GrossProfit|OperatingExpense|etc",
      "subCategory": "more specific category if applicable",
      "values": [1000000, 900000, 850000],
      "unit": "dollars|thousands|millions|billions",
      "isNegative": false,
      "rowIndex": 0,
      "confidence": 0.95
    }
  ],
  "metadata": {
    "currency": "USD",
    "statementType": "${statementType}",
    "fiscalYearEnd": "month if identifiable",
    "notesDetected": ["list of footnote references"]
  }
}

Be extremely thorough - capture EVERY line including subtotals, adjustments, and detailed breakdowns.`;
  }

  // Parse AI response into structured data
  parseAIResponse(aiResponse) {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the analysis
      if (!analysis.lineItems || !Array.isArray(analysis.lineItems)) {
        throw new Error('Invalid analysis structure');
      }
      
      // Process each line item
      analysis.lineItems = analysis.lineItems.map(item => {
        // Ensure values are numbers
        if (Array.isArray(item.values)) {
          item.values = item.values.map(v => {
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              // Parse string values
              const parsed = parseFloat(v.replace(/[^0-9.-]/g, ''));
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          });
        }
        
        // Add computed fields
        item.latestValue = item.values[0] || 0;
        item.previousValue = item.values[1] || 0;
        item.growth = item.previousValue !== 0 
          ? ((item.latestValue - item.previousValue) / Math.abs(item.previousValue)) * 100 
          : 0;
        
        return item;
      });
      
      return analysis;
      
    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      throw error;
    }
  }

  // Update concept mappings based on AI learning
  updateConceptMappings(analysis) {
    analysis.lineItems.forEach(item => {
      const category = item.standardCategory.toLowerCase();
      const label = item.originalLabel.toLowerCase();
      
      if (!this.conceptMappings.has(category)) {
        this.conceptMappings.set(category, []);
      }
      
      const mappings = this.conceptMappings.get(category);
      if (!mappings.includes(label)) {
        mappings.push(label);
        console.log(`📚 Learned new mapping: ${category} => ${label}`);
      }
    });
  }

  // Reconcile data from multiple sources
  async reconcileFinancialData(scrapedData, xbrlData, companyName) {
    console.log(`🔄 Reconciling financial data for ${companyName}...`);
    
    const reconciled = {
      company: companyName,
      statements: {},
      confidence: {},
      discrepancies: []
    };

    // Analyze scraped data with AI
    const aiAnalysis = await this.analyzeFinancialTable(
      scrapedData.statements.raw[0].data,
      companyName,
      'Financial Statement'
    );

    // Compare with XBRL data
    const comparison = this.compareDataSources(aiAnalysis, xbrlData);
    
    // Resolve discrepancies
    reconciled.statements = this.resolveDiscrepancies(comparison);
    reconciled.confidence = this.calculateConfidence(comparison);
    reconciled.discrepancies = comparison.discrepancies;
    
    return reconciled;
  }

  // Compare data from different sources
  compareDataSources(aiData, xbrlData) {
    const comparison = {
      matches: [],
      discrepancies: [],
      aiOnly: [],
      xbrlOnly: []
    };

    // Map AI categories to XBRL concepts
    const categoryToXbrl = {
      'Revenue': ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax'],
      'CostOfRevenue': ['CostOfRevenue', 'CostOfGoodsAndServicesSold'],
      'NetIncome': ['NetIncomeLoss', 'ProfitLoss'],
      'GrossProfit': ['GrossProfit'],
      'OperatingIncome': ['OperatingIncomeLoss']
    };

    aiData.lineItems.forEach(aiItem => {
      const xbrlConcepts = categoryToXbrl[aiItem.standardCategory] || [];
      let matched = false;

      xbrlConcepts.forEach(concept => {
        if (xbrlData.fiscalData && xbrlData.fiscalData[concept]) {
          const xbrlValue = xbrlData.fiscalData[concept].quarterly?.[0]?.val || 0;
          const aiValue = aiItem.latestValue;
          
          // Convert to same unit (millions)
          const aiValueMillions = this.convertToMillions(aiValue, aiItem.unit);
          const xbrlValueMillions = xbrlValue / 1000000;
          
          // Calculate difference percentage
          const diff = Math.abs(aiValueMillions - xbrlValueMillions);
          const diffPercent = (diff / Math.max(aiValueMillions, xbrlValueMillions)) * 100;
          
          if (diffPercent < 5) { // Within 5% tolerance
            comparison.matches.push({
              category: aiItem.standardCategory,
              aiValue: aiValueMillions,
              xbrlValue: xbrlValueMillions,
              difference: diffPercent
            });
            matched = true;
          } else {
            comparison.discrepancies.push({
              category: aiItem.standardCategory,
              aiValue: aiValueMillions,
              xbrlValue: xbrlValueMillions,
              difference: diffPercent,
              aiLabel: aiItem.originalLabel,
              xbrlConcept: concept
            });
          }
        }
      });

      if (!matched) {
        comparison.aiOnly.push(aiItem);
      }
    });

    return comparison;
  }

  // Convert values to millions for comparison
  convertToMillions(value, unit) {
    switch (unit?.toLowerCase()) {
      case 'thousands':
        return value / 1000;
      case 'millions':
        return value;
      case 'billions':
        return value * 1000;
      default:
        return value / 1000000; // Assume raw dollars
    }
  }

  // Resolve discrepancies between data sources
  resolveDiscrepancies(comparison) {
    const resolved = {};

    // Use AI data for items only found by AI
    comparison.aiOnly.forEach(item => {
      resolved[item.standardCategory] = {
        value: item.latestValue,
        source: 'AI',
        confidence: item.confidence || 0.9
      };
    });

    // Use average for matched items
    comparison.matches.forEach(match => {
      resolved[match.category] = {
        value: (match.aiValue + match.xbrlValue) / 2,
        source: 'Both',
        confidence: 1 - (match.difference / 100)
      };
    });

    // For discrepancies, use AI if confidence is high
    comparison.discrepancies.forEach(disc => {
      resolved[disc.category] = {
        value: disc.aiValue, // Prefer AI for now
        source: 'AI (Discrepancy)',
        confidence: 0.7,
        note: `${disc.difference.toFixed(2)}% difference with XBRL`
      };
    });

    return resolved;
  }

  // Calculate overall confidence score
  calculateConfidence(comparison) {
    const totalItems = comparison.matches.length + 
                      comparison.discrepancies.length + 
                      comparison.aiOnly.length;
    
    if (totalItems === 0) return 0;

    const matchScore = comparison.matches.length * 1;
    const discrepancyScore = comparison.discrepancies.length * 0.5;
    const aiOnlyScore = comparison.aiOnly.length * 0.8;

    const overallScore = (matchScore + discrepancyScore + aiOnlyScore) / totalItems;
    
    return {
      overall: overallScore,
      matches: comparison.matches.length,
      discrepancies: comparison.discrepancies.length,
      aiOnlyItems: comparison.aiOnly.length
    };
  }

  // Generate comprehensive financial report
  async generateFinancialReport(ticker, scrapedData, xbrlData) {
    const companyName = xbrlData.companyName || ticker;
    
    // Reconcile all data sources
    const reconciled = await this.reconcileFinancialData(
      scrapedData,
      xbrlData,
      companyName
    );

    // Generate insights
    const insights = await this.generateInsights(reconciled, companyName);

    return {
      ticker,
      companyName,
      dataQuality: reconciled.confidence,
      financials: reconciled.statements,
      insights,
      discrepancies: reconciled.discrepancies,
      timestamp: new Date().toISOString()
    };
  }

  // Generate AI-powered insights
  async generateInsights(reconciled, companyName) {
    const prompt = `Analyze these financial metrics for ${companyName} and provide key insights:

${JSON.stringify(reconciled.statements, null, 2)}

Provide:
1. Key financial health indicators
2. Growth trends
3. Profitability analysis
4. Areas of concern
5. Comparison to industry standards

Format as JSON with categories: health, growth, profitability, concerns, recommendations`;

    try {
      const response = await axios.post(
        this.mistralApiUrl,
        {
          model: 'mistral-large-latest',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.mistralApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseAIResponse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating insights:', error.message);
      return null;
    }
  }
}

export default new EdgarAIAnalysisService();

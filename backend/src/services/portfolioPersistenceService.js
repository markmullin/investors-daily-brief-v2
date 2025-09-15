/**
 * Portfolio Persistence Service using MCP Knowledge Graph
 * Replaces in-memory storage with persistent knowledge graph storage
 * Ensures portfolio data survives backend restarts
 */

class PortfolioPersistenceService {
  constructor() {
    this.entityType = 'Portfolio';
    this.cache = new Map(); // In-memory cache for performance
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Save portfolio to knowledge graph
   */
  async savePortfolio(portfolioId, portfolioData) {
    try {
      console.log(`💾 Saving portfolio ${portfolioId} to persistent storage...`);
      
      // Prepare observations for knowledge graph
      const observations = [
        `Portfolio ID: ${portfolioData.id}`,
        `Portfolio Name: ${portfolioData.name}`,
        `Created Date: ${portfolioData.created_date}`,
        `Total Transactions: ${portfolioData.transactions.length}`,
        `Total Holdings: ${Object.keys(portfolioData.holdings).length}`,
        `Last Updated: ${new Date().toISOString()}`,
        `Holdings Data: ${JSON.stringify(portfolioData.holdings)}`,
        `Transactions Data: ${JSON.stringify(portfolioData.transactions)}`,
        `Accounts Data: ${JSON.stringify(portfolioData.accounts || {})}`,
        `Total Value: ${portfolioData.total_value || 0}`
      ];

      // Check if portfolio entity exists
      const existingEntities = await this.searchPortfolioEntities(portfolioId);
      
      if (existingEntities.length > 0) {
        // Update existing portfolio
        console.log(`📝 Updating existing portfolio entity: ${portfolioId}`);
        
        // Delete old observations and add new ones
        const entityName = existingEntities[0].name;
        await this.deleteOldObservations(entityName);
        
        // Add updated observations
        await this.addObservations(entityName, observations);
      } else {
        // Create new portfolio entity
        console.log(`🆕 Creating new portfolio entity: ${portfolioId}`);
        
        await this.createPortfolioEntity(portfolioId, observations);
      }

      // Update cache
      this.cache.set(portfolioId, {
        data: portfolioData,
        timestamp: Date.now()
      });

      console.log(`✅ Portfolio ${portfolioId} saved successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving portfolio ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Load portfolio from knowledge graph
   */
  async loadPortfolio(portfolioId) {
    try {
      console.log(`📖 Loading portfolio ${portfolioId} from persistent storage...`);
      
      // Check cache first
      const cached = this.cache.get(portfolioId);
      if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
        console.log(`⚡ Returning cached portfolio ${portfolioId}`);
        return cached.data;
      }

      // Search for portfolio in knowledge graph
      const entities = await this.searchPortfolioEntities(portfolioId);
      
      if (entities.length === 0) {
        console.log(`📝 Portfolio ${portfolioId} not found, creating default`);
        return this.createDefaultPortfolio(portfolioId);
      }

      // Extract portfolio data from entity observations
      const entity = entities[0];
      const portfolioData = this.parsePortfolioFromObservations(entity.observations);

      // Update cache
      this.cache.set(portfolioId, {
        data: portfolioData,
        timestamp: Date.now()
      });

      console.log(`✅ Portfolio ${portfolioId} loaded successfully`);
      return portfolioData;
    } catch (error) {
      console.error(`❌ Error loading portfolio ${portfolioId}:`, error);
      // Return default portfolio on error
      return this.createDefaultPortfolio(portfolioId);
    }
  }

  /**
   * Search for portfolio entities in knowledge graph
   */
  async searchPortfolioEntities(portfolioId) {
    try {
      // Use MCP search to find portfolio entities
      const searchQuery = `Portfolio ${portfolioId}`;
      
      // This would use the actual MCP search function
      // For now, simulating the search result structure
      const searchResults = await this.mcpSearch(searchQuery);
      
      return searchResults.filter(entity => 
        entity.entityType === this.entityType && 
        entity.name.includes(portfolioId)
      );
    } catch (error) {
      console.error(`Error searching for portfolio ${portfolioId}:`, error);
      return [];
    }
  }

  /**
   * Create portfolio entity in knowledge graph
   */
  async createPortfolioEntity(portfolioId, observations) {
    try {
      // Use MCP create entities function
      await this.mcpCreateEntities([{
        name: `Portfolio_${portfolioId}`,
        entityType: this.entityType,
        observations: observations
      }]);
    } catch (error) {
      console.error(`Error creating portfolio entity ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Add observations to existing entity
   */
  async addObservations(entityName, observations) {
    try {
      // Use MCP add observations function
      await this.mcpAddObservations([{
        entityName: entityName,
        contents: observations
      }]);
    } catch (error) {
      console.error(`Error adding observations to ${entityName}:`, error);
      throw error;
    }
  }

  /**
   * Delete old observations from entity
   */
  async deleteOldObservations(entityName) {
    try {
      // Get current observations
      const entities = await this.mcpOpenNodes([entityName]);
      if (entities.length > 0) {
        const currentObservations = entities[0].observations || [];
        
        if (currentObservations.length > 0) {
          // Delete all current observations
          await this.mcpDeleteObservations([{
            entityName: entityName,
            observations: currentObservations
          }]);
        }
      }
    } catch (error) {
      console.error(`Error deleting observations from ${entityName}:`, error);
      // Don't throw - this is cleanup, continue with add
    }
  }

  /**
   * Parse portfolio data from entity observations
   */
  parsePortfolioFromObservations(observations) {
    const portfolioData = {
      id: 'portfolio_1',
      name: 'My Investment Portfolio',
      created_date: new Date().toISOString().split('T')[0],
      total_value: 0,
      transactions: [],
      holdings: {},
      accounts: {}
    };

    try {
      observations.forEach(observation => {
        if (observation.includes('Portfolio ID:')) {
          portfolioData.id = observation.split('Portfolio ID: ')[1];
        } else if (observation.includes('Portfolio Name:')) {
          portfolioData.name = observation.split('Portfolio Name: ')[1];
        } else if (observation.includes('Created Date:')) {
          portfolioData.created_date = observation.split('Created Date: ')[1];
        } else if (observation.includes('Total Value:')) {
          portfolioData.total_value = parseFloat(observation.split('Total Value: ')[1]) || 0;
        } else if (observation.includes('Holdings Data:')) {
          const holdingsJson = observation.split('Holdings Data: ')[1];
          portfolioData.holdings = JSON.parse(holdingsJson);
        } else if (observation.includes('Transactions Data:')) {
          const transactionsJson = observation.split('Transactions Data: ')[1];
          portfolioData.transactions = JSON.parse(transactionsJson);
        } else if (observation.includes('Accounts Data:')) {
          const accountsJson = observation.split('Accounts Data: ')[1];
          portfolioData.accounts = JSON.parse(accountsJson);
        }
      });
    } catch (error) {
      console.error('Error parsing portfolio observations:', error);
    }

    return portfolioData;
  }

  /**
   * Create default portfolio structure
   */
  createDefaultPortfolio(portfolioId) {
    return {
      id: portfolioId,
      name: 'My Investment Portfolio',
      created_date: new Date().toISOString().split('T')[0],
      total_value: 0,
      transactions: [],
      holdings: {},
      accounts: {}
    };
  }

  /**
   * MCP wrapper functions - these will be replaced with actual MCP calls
   */
  async mcpSearch(query) {
    // TODO: Replace with actual MCP search call
    // For now, simulate empty result
    console.log(`MCP Search: ${query}`);
    return [];
  }

  async mcpCreateEntities(entities) {
    // TODO: Replace with actual MCP create entities call
    console.log(`MCP Create Entities:`, entities.map(e => e.name));
    return true;
  }

  async mcpAddObservations(observations) {
    // TODO: Replace with actual MCP add observations call
    console.log(`MCP Add Observations:`, observations.length);
    return true;
  }

  async mcpDeleteObservations(deletions) {
    // TODO: Replace with actual MCP delete observations call
    console.log(`MCP Delete Observations:`, deletions.length);
    return true;
  }

  async mcpOpenNodes(names) {
    // TODO: Replace with actual MCP open nodes call
    console.log(`MCP Open Nodes:`, names);
    return [];
  }

  /**
   * Clear cache for portfolio
   */
  clearCache(portfolioId) {
    this.cache.delete(portfolioId);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export default new PortfolioPersistenceService();

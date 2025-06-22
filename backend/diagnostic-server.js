/**
 * DIAGNOSTIC SERVER - Find where the main server hangs
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Add step-by-step logging
console.log('🔍 DIAGNOSTIC: Starting server initialization...');

class DiagnosticServer {
  constructor() {
    this.app = express();
    console.log('🔍 DIAGNOSTIC: Express app created');
  }

  async setupBasicMiddleware() {
    console.log('🔍 DIAGNOSTIC: Setting up basic middleware...');
    
    // Basic CORS
    this.app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true
    }));
    console.log('🔍 DIAGNOSTIC: CORS configured');

    this.app.use(express.json());
    console.log('🔍 DIAGNOSTIC: JSON parsing configured');
    
    console.log('✅ DIAGNOSTIC: Basic middleware completed');
  }

  async setupBasicRoutes() {
    console.log('🔍 DIAGNOSTIC: Setting up basic routes...');
    
    this.app.get('/health', (req, res) => {
      res.json({ status: 'diagnostic_ok', timestamp: new Date().toISOString() });
    });
    
    this.app.get('/api/market/data', (req, res) => {
      res.json({ 
        message: 'Diagnostic server working!',
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('✅ DIAGNOSTIC: Basic routes completed');
  }

  async testDatabaseHealth() {
    console.log('🔍 DIAGNOSTIC: Testing database health check...');
    
    try {
      // Import the database health check
      const { checkDatabaseHealth } = await import('./src/config/database.js');
      console.log('🔍 DIAGNOSTIC: Database module imported');
      
      const health = await checkDatabaseHealth();
      console.log('🔍 DIAGNOSTIC: Database health result:', health);
      console.log('✅ DIAGNOSTIC: Database health check completed');
    } catch (error) {
      console.log('❌ DIAGNOSTIC: Database health check failed:', error.message);
      throw error;
    }
  }

  async testComplexMiddleware() {
    console.log('🔍 DIAGNOSTIC: Testing complex middleware imports...');
    
    try {
      // Test middleware imports one by one
      console.log('🔍 DIAGNOSTIC: Importing logger...');
      const { default: logger } = await import('./src/utils/logger.js');
      console.log('✅ DIAGNOSTIC: Logger imported');

      console.log('🔍 DIAGNOSTIC: Importing error handler...');
      const { errorHandler } = await import('./src/middleware/errorHandler.js');
      console.log('✅ DIAGNOSTIC: Error handler imported');

      console.log('🔍 DIAGNOSTIC: Importing security middleware...');
      const { corsOptions } = await import('./src/middleware/security.js');
      console.log('✅ DIAGNOSTIC: Security middleware imported');

      console.log('✅ DIAGNOSTIC: All middleware imports successful');
    } catch (error) {
      console.log('❌ DIAGNOSTIC: Middleware import failed:', error.message);
      throw error;
    }
  }

  async testRouteImports() {
    console.log('🔍 DIAGNOSTIC: Testing route imports...');
    
    try {
      console.log('🔍 DIAGNOSTIC: Importing market routes...');
      const marketRoutes = await import('./src/routes/market.js');
      console.log('✅ DIAGNOSTIC: Market routes imported');

      console.log('🔍 DIAGNOSTIC: Importing risk positioning routes...');
      const riskRoutes = await import('./src/routes/riskPositioning.js');
      console.log('✅ DIAGNOSTIC: Risk positioning routes imported');

      console.log('✅ DIAGNOSTIC: Critical route imports successful');
    } catch (error) {
      console.log('❌ DIAGNOSTIC: Route import failed:', error.message);
      throw error;
    }
  }

  async start() {
    try {
      console.log('🔍 DIAGNOSTIC: Step 1 - Basic middleware');
      await this.setupBasicMiddleware();

      console.log('🔍 DIAGNOSTIC: Step 2 - Basic routes');
      await this.setupBasicRoutes();

      console.log('🔍 DIAGNOSTIC: Step 3 - Database health');
      await this.testDatabaseHealth();

      console.log('🔍 DIAGNOSTIC: Step 4 - Complex middleware');
      await this.testComplexMiddleware();

      console.log('🔍 DIAGNOSTIC: Step 5 - Route imports');
      await this.testRouteImports();

      console.log('🔍 DIAGNOSTIC: Step 6 - Starting server');
      this.app.listen(5000, () => {
        console.log('🎉 DIAGNOSTIC: Server started successfully on port 5000!');
        console.log('🔍 DIAGNOSTIC: All steps completed - the issue is likely in the full server');
      });

    } catch (error) {
      console.log('💥 DIAGNOSTIC: Failed at step:', error.message);
      console.log('🔍 DIAGNOSTIC: This is where the main server is hanging!');
    }
  }
}

const diagnosticServer = new DiagnosticServer();
diagnosticServer.start();

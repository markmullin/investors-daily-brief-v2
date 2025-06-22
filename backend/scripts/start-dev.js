/**
 * Market Dashboard Development Startup Script
 * Starts both Express backend and Python microservice
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import { checkDatabaseHealth } from '../src/config/database.js';

class DevelopmentStarter {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
  }

  async start() {
    console.log(chalk.blue.bold('🚀 STARTING MARKET DASHBOARD DEVELOPMENT ENVIRONMENT'));
    console.log(chalk.blue('='.repeat(60)));
    console.log();

    try {
      // Check system health first
      await this.checkSystemHealth();

      // Start processes
      await this.startPythonService();
      await this.startBackendServer();

      // Setup shutdown handlers
      this.setupShutdownHandlers();

      console.log();
      console.log(chalk.green.bold('🎉 DEVELOPMENT ENVIRONMENT READY!'));
      console.log();
      this.displayServiceInfo();

    } catch (error) {
      console.error(chalk.red.bold('❌ STARTUP FAILED:'), error.message);
      this.cleanup();
      process.exit(1);
    }
  }

  async checkSystemHealth() {
    console.log(chalk.yellow('🔍 Checking system health...'));
    
    try {
      const health = await checkDatabaseHealth();
      
      console.log(`PostgreSQL: ${health.postgres ? chalk.green('✅ Ready') : chalk.red('❌ Failed')}`);
      console.log(`Redis: ${health.redis ? chalk.green('✅ Ready') : chalk.yellow('⚠️  Optional')}`);
      console.log(`InfluxDB: ${health.influx ? chalk.green('✅ Ready') : chalk.yellow('⚠️  Optional')}`);

      if (!health.postgres) {
        throw new Error('PostgreSQL is required but not available. Please run: npm run db:setup');
      }

      console.log(chalk.green('✅ System health check passed'));
    } catch (error) {
      throw new Error(`System health check failed: ${error.message}`);
    }
  }

  async startPythonService() {
    console.log(chalk.yellow('🐍 Starting Python calculation service...'));
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
        cwd: './python',
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });

      this.processes.push({
        name: 'Python Service',
        process: pythonProcess,
        color: chalk.blue,
        port: 8000
      });

      let isResolved = false;

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(chalk.blue('[Python]'), output.trim());
        
        if (output.includes('Uvicorn running') && !isResolved) {
          console.log(chalk.green('✅ Python service started on port 8000'));
          isResolved = true;
          resolve();
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('WARNING')) { // Filter out uvicorn warnings
          console.error(chalk.blue('[Python Error]'), output.trim());
        }
      });

      pythonProcess.on('error', (error) => {
        if (!isResolved) {
          console.error(chalk.red('❌ Failed to start Python service:'), error.message);
          reject(error);
        }
      });

      pythonProcess.on('exit', (code) => {
        if (code !== 0 && !this.isShuttingDown) {
          console.error(chalk.red(`❌ Python service exited with code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!isResolved) {
          console.log(chalk.green('✅ Python service startup initiated (may take a moment to fully load)'));
          isResolved = true;
          resolve();
        }
      }, 10000);
    });
  }

  async startBackendServer() {
    console.log(chalk.yellow('⚡ Starting Express backend server...'));
    
    return new Promise((resolve, reject) => {
      const backendProcess = spawn('node', ['src/server.js'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' }
      });

      this.processes.push({
        name: 'Backend Server',
        process: backendProcess,
        color: chalk.green,
        port: 5000
      });

      let isResolved = false;

      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(chalk.green('[Backend]'), output.trim());
        
        if (output.includes('started on port') && !isResolved) {
          console.log(chalk.green('✅ Backend server started on port 5000'));
          isResolved = true;
          resolve();
        }
      });

      backendProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error(chalk.green('[Backend Error]'), output.trim());
      });

      backendProcess.on('error', (error) => {
        if (!isResolved) {
          console.error(chalk.red('❌ Failed to start backend server:'), error.message);
          reject(error);
        }
      });

      backendProcess.on('exit', (code) => {
        if (code !== 0 && !this.isShuttingDown) {
          console.error(chalk.red(`❌ Backend server exited with code ${code}`));
        }
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!isResolved) {
          console.log(chalk.green('✅ Backend server startup initiated'));
          isResolved = true;
          resolve();
        }
      }, 15000);
    });
  }

  setupShutdownHandlers() {
    const shutdown = (signal) => {
      if (this.isShuttingDown) return;
      
      console.log();
      console.log(chalk.yellow(`🛑 Received ${signal}. Shutting down development environment...`));
      this.cleanup();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  cleanup() {
    this.isShuttingDown = true;
    
    this.processes.forEach(({ name, process: proc }) => {
      if (proc && !proc.killed) {
        console.log(chalk.yellow(`Stopping ${name}...`));
        proc.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (!proc.killed) {
            proc.kill('SIGKILL');
          }
        }, 5000);
      }
    });

    setTimeout(() => {
      console.log(chalk.blue('👋 Development environment stopped'));
      process.exit(0);
    }, 1000);
  }

  displayServiceInfo() {
    console.log(chalk.blue.bold('📊 SERVICES RUNNING:'));
    console.log();
    console.log(chalk.green('🌐 Backend API Server'));
    console.log(chalk.white('   URL: http://localhost:5000'));
    console.log(chalk.white('   Health: http://localhost:5000/health'));
    console.log(chalk.white('   API Docs: http://localhost:5000/api'));
    console.log();
    console.log(chalk.blue('🐍 Python Calculation Service'));
    console.log(chalk.white('   URL: http://localhost:8000'));
    console.log(chalk.white('   Docs: http://localhost:8000/docs'));
    console.log();
    console.log(chalk.yellow.bold('💡 USEFUL COMMANDS:'));
    console.log(chalk.white('   Test authentication: curl -X POST http://localhost:5000/api/auth/login \\'));
    console.log(chalk.white('                             -H "Content-Type: application/json" \\'));
    console.log(chalk.white('                             -d \'{"emailOrUsername":"admin","password":"AdminPassword123!"}\''));
    console.log();
    console.log(chalk.white('   Test Python service: curl http://localhost:8000/'));
    console.log();
    console.log(chalk.green.bold('🚀 READY TO BUILD AMAZING FEATURES!'));
    console.log(chalk.blue('Press Ctrl+C to stop all services'));
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const starter = new DevelopmentStarter();
  starter.start().catch((error) => {
    console.error(chalk.red('Failed to start development environment:'), error);
    process.exit(1);
  });
}

export default DevelopmentStarter;
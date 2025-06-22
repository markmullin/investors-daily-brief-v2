// pythonBridge.js - FIXED version with better environment detection
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PythonBridge {
  constructor() {
    this.pythonPath = 'python';
    this.scriptsPath = path.join(process.cwd(), 'python');
    this.isReady = false;
  }

  /**
   * FIXED: Better Python environment check
   */
  async checkPythonEnvironment() {
    try {
      console.log('🐍 Checking Python environment...');
      
      // Check if Python is available
      const pythonCheck = await this.runCommand('python', ['--version']);
      console.log('✅ Python version:', pythonCheck.stdout.trim());
      
      // FIXED: Test packages more reliably
      const testScript = `
import sys
try:
    import numpy
    print("numpy OK - version:", numpy.__version__)
except ImportError as e:
    print("numpy MISSING:", str(e))
    sys.exit(1)

try:
    import pandas  
    print("pandas OK - version:", pandas.__version__)
except ImportError as e:
    print("pandas MISSING:", str(e))
    sys.exit(1)

try:
    import scipy
    print("scipy OK - version:", scipy.__version__)
except ImportError as e:
    print("scipy MISSING:", str(e))
    sys.exit(1)

try:
    import sklearn
    print("sklearn OK - version:", sklearn.__version__)
except ImportError as e:
    print("sklearn MISSING:", str(e))
    sys.exit(1)

print("ALL PACKAGES OK")
`;
      
      const packageCheck = await this.runCommand('python', ['-c', testScript]);
      console.log(packageCheck.stdout);
      
      if (packageCheck.stdout.includes('ALL PACKAGES OK')) {
        this.isReady = true;
        console.log('✅ Python environment is ready');
        return true;
      } else {
        console.log('❌ Some packages are missing');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Python environment check failed:', error.message);
      return false;
    }
  }

  /**
   * Run Python analysis script with data
   */
  async runPythonAnalysis(scriptName, data) {
    try {
      if (!this.isReady) {
        const envCheck = await this.checkPythonEnvironment();
        if (!envCheck) {
          throw new Error('Python environment not ready');
        }
      }

      console.log(`🐍 Running Python analysis: ${scriptName}`);
      
      // Write data to temporary file
      const tempDataFile = path.join(this.scriptsPath, 'temp_data.json');
      await fs.writeFile(tempDataFile, JSON.stringify(data, null, 2));
      
      // Run Python script
      const scriptPath = path.join(this.scriptsPath, scriptName);
      const result = await this.runCommand('python', [scriptPath, tempDataFile]);
      
      // Parse result
      const output = JSON.parse(result.stdout);
      
      // Clean up temp file
      try {
        await fs.unlink(tempDataFile);
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up temp file:', cleanupError.message);
      }
      
      console.log(`✅ Python analysis completed: ${scriptName}`);
      return output;
      
    } catch (error) {
      console.error(`❌ Python analysis failed (${scriptName}):`, error.message);
      throw error;
    }
  }

  /**
   * FIXED: Better command execution with proper error handling
   */
  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      console.log(`Executing: ${command} ${args.join(' ')}`);
      
      const process = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Calculate technical indicators using Python
   */
  async calculateTechnicalIndicators(priceData) {
    try {
      const result = await this.runPythonAnalysis('technical_indicators.py', {
        prices: priceData,
        indicators: ['rsi', 'ma200', 'bollinger_bands', 'macd']
      });
      
      return result;
    } catch (error) {
      console.error('❌ Technical indicators calculation failed:', error);
      return null;
    }
  }

  /**
   * Perform market analysis using Python
   */
  async performMarketAnalysis(marketData) {
    try {
      const result = await this.runPythonAnalysis('market_analysis.py', marketData);
      return result;
    } catch (error) {
      console.error('❌ Market analysis failed:', error);
      return null;
    }
  }

  /**
   * Calculate portfolio metrics using Python
   */
  async calculatePortfolioMetrics(portfolioData) {
    try {
      const result = await this.runPythonAnalysis('portfolio_metrics.py', portfolioData);
      return result;
    } catch (error) {
      console.error('❌ Portfolio metrics calculation failed:', error);
      return null;
    }
  }
}

// Create singleton instance
const pythonBridge = new PythonBridge();

export default pythonBridge;

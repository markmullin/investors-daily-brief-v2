import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PythonBridge {
  constructor() {
    this.pythonPath = path.join(__dirname, '../../python');
    this.tempDataPath = path.join(this.pythonPath, 'temp_data.json');
  }

  /**
   * Execute a Python script with JSON input data
   * @param {string} scriptName - Name of the Python script (without .py)
   * @param {object} inputData - Data to pass to the script
   * @returns {Promise<object>} - Parsed JSON result from Python script
   */
  async runScript(scriptName, inputData) {
    try {
      // Write input data to temporary file
      await fs.writeFile(this.tempDataPath, JSON.stringify(inputData, null, 2));
      
      const scriptPath = path.join(this.pythonPath, `${scriptName}.py`);
      
      // Verify script exists
      try {
        await fs.access(scriptPath);
      } catch (error) {
        throw new Error(`Python script not found: ${scriptPath}`);
      }

      return new Promise((resolve, reject) => {
        const python = spawn('python', [scriptPath, this.tempDataPath], {
          cwd: this.pythonPath,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python script failed with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${stdout}`));
          }
        });

        python.on('error', (error) => {
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });

        // Set timeout for long-running scripts
        setTimeout(() => {
          python.kill();
          reject(new Error('Python script timed out after 30 seconds'));
        }, 30000);
      });
    } catch (error) {
      throw new Error(`PythonBridge error: ${error.message}`);
    }
  }

  /**
   * PHASE 2: Comprehensive Technical Analysis Engine
   * Analyzes price data and generates actionable insights with natural language summaries
   * @param {Array} priceData - Array of price data points
   * @param {string} symbol - Stock symbol for analysis
   * @param {string} timeframe - Time period for analysis ('1d', '1w', '1m', etc.)
   * @returns {Promise<object>} - Comprehensive technical analysis with insights
   */
  async analyzeTechnicalPatterns(priceData, symbol = 'STOCK', timeframe = '1d') {
    const inputData = {
      price_data: priceData,
      symbol: symbol,
      timeframe: timeframe
    };

    console.log(`🐍 [PYTHON BRIDGE] Starting technical analysis for ${symbol} (${timeframe})`);
    
    try {
      const result = await this.runScript('technical_analysis_engine', inputData);
      
      if (result.error) {
        console.error(`❌ [PYTHON BRIDGE] Technical analysis failed: ${result.error}`);
        return {
          error: result.error,
          analysis: {},
          symbol,
          timeframe
        };
      }
      
      console.log(`✅ [PYTHON BRIDGE] Technical analysis completed for ${symbol}`);
      return result;
      
    } catch (error) {
      console.error(`❌ [PYTHON BRIDGE] Technical analysis error: ${error.message}`);
      return {
        error: `Technical analysis failed: ${error.message}`,
        analysis: {},
        symbol,
        timeframe
      };
    }
  }

  /**
   * Calculate technical indicators using technical_indicators.py
   * @param {Array} priceData - Array of price data points
   * @param {string} period - Time period for analysis ('1d', '1w', '1m', etc.)
   * @returns {Promise<object>} - Technical indicators analysis
   */
  async calculateTechnicalIndicators(priceData, period = '1d') {
    const inputData = {
      price_history: priceData,
      period: period,
      view_mode: 'advanced'
    };

    return await this.runScript('technical_indicators', inputData);
  }

  /**
   * Analyze portfolio metrics using portfolio_metrics.py
   * @param {Array} holdings - Portfolio holdings data
   * @param {Array} benchmarks - Benchmark data for comparison
   * @returns {Promise<object>} - Portfolio analysis results
   */
  async analyzePortfolioMetrics(holdings, benchmarks = []) {
    const inputData = {
      portfolio_holdings: holdings,
      benchmarks: benchmarks,
      view_mode: 'advanced'
    };

    return await this.runScript('portfolio_metrics', inputData);
  }

  /**
   * Perform macroeconomic analysis using macro_analysis.py
   * @param {object} economicData - Economic indicators and data
   * @returns {Promise<object>} - Macro analysis results
   */
  async performMacroAnalysis(economicData) {
    const inputData = {
      economic_data: economicData,
      view_mode: 'advanced'
    };

    return await this.runScript('macro_analysis', inputData);
  }

  /**
   * Calculate market environment score using market_environment.py
   * @param {Array} priceHistory - Historical price data
   * @param {Array} sectorData - Sector performance data
   * @returns {Promise<object>} - Market environment analysis
   */
  async calculateMarketEnvironment(priceHistory, sectorData) {
    const inputData = {
      price_history: priceHistory,
      sector_data: sectorData,
      view_mode: 'advanced'
    };

    return await this.runScript('market_environment', inputData);
  }

  /**
   * Analyze sector rotation using sector_rotation.py
   * @param {Array} sectorData - Sector performance data
   * @param {string} timeframe - Analysis timeframe
   * @returns {Promise<object>} - Sector rotation analysis
   */
  async analyzeSectorRotation(sectorData, timeframe = '3m') {
    const inputData = {
      sector_data: sectorData,
      timeframe: timeframe,
      view_mode: 'advanced'
    };

    return await this.runScript('sector_rotation', inputData);
  }

  /**
   * Test connection to Python environment
   * @returns {Promise<boolean>} - True if Python is accessible
   */
  async testConnection() {
    try {
      const testData = { test: true, timestamp: new Date().toISOString() };
      const result = await this.runScript('test_imports', testData);
      return result && !result.error;
    } catch (error) {
      console.error('Python connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get Python environment status
   * @returns {Promise<object>} - Environment status and package info
   */
  async getEnvironmentStatus() {
    try {
      const result = await this.runScript('test_config', {});
      return result;
    } catch (error) {
      return {
        error: true,
        message: error.message,
        python_accessible: false
      };
    }
  }
}

// Create singleton instance
const pythonBridge = new PythonBridge();

export default pythonBridge;
export { PythonBridge };

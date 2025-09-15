/**
 * PYTHON GPU BRIDGE SERVICE
 * Handles communication with GPU-accelerated Python analytics
 * Returns structured insights for AI models, NOT raw calculations
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class PythonGpuBridge {
  constructor() {
    this.pythonPath = path.join(__dirname, '../../python');
    this.tempDir = path.join(__dirname, '../../temp');
    this.scriptPath = path.join(this.pythonPath, 'gpu_analytics.py');
    this.initialized = false;
    
    // Ensure temp directory exists - will be called on first use
    this.initPromise = this.ensureTempDir().then(() => {
      this.initialized = true;
      console.log('✅ Temp directory ready');
    }).catch(err => {
      console.error('❌ Failed to create temp directory:', err);
    });
    
    console.log('🐍 Python GPU Bridge initialized');
    console.log(`📁 Python scripts: ${this.pythonPath}`);
    console.log(`📁 Temp directory: ${this.tempDir}`);
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Analyze financial data with GPU acceleration
   * Returns structured insights, NOT raw calculations
   */
  async analyzeTechnicalData(priceData, indicators = ['rsi', 'macd', 'bollinger_bands', 'ma200']) {
    try {
      console.log('🚀 Running GPU-accelerated technical analysis...');
      
      // Prepare input data
      const inputData = {
        prices: Array.isArray(priceData) ? priceData : priceData?.prices || [],
        indicators: indicators,
        timestamp: new Date().toISOString()
      };

      // Validate input
      if (!inputData.prices || inputData.prices.length < 10) {
        return {
          success: false,
          error: 'Insufficient price data (need at least 10 data points)',
          insights: {}
        };
      }

      console.log(`📊 Analyzing ${inputData.prices.length} price points with ${indicators.length} indicators`);

      // Write input to temp file
      const inputFile = path.join(this.tempDir, `input_${Date.now()}.json`);
      await fs.writeFile(inputFile, JSON.stringify(inputData, null, 2));

      // Run Python analysis
      const result = await this.runPythonScript('gpu_analytics.py', inputFile);

      // Clean up temp file
      try {
        await fs.unlink(inputFile);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError.message);
      }

      if (result.success) {
        console.log('✅ GPU analysis completed successfully');
        console.log(`📈 Generated insights for: ${Object.keys(result.insights).join(', ')}`);
        
        // Return structured insights (not raw numbers)
        return {
          success: true,
          insights: result.insights,
          dataQuality: result.data_quality,
          processingTime: result.processing_time || 'N/A',
          gpuAccelerated: result.gpu_accelerated || false,
          timestamp: result.timestamp
        };
      } else {
        console.error('❌ GPU analysis failed:', result.error);
        return {
          success: false,
          error: result.error,
          insights: {}
        };
      }

    } catch (error) {
      console.error('❌ Python GPU Bridge error:', error);
      return {
        success: false,
        error: `Analysis failed: ${error.message}`,
        insights: {}
      };
    }
  }

  /**
   * Analyze market metrics and return interpretations
   */
  async analyzeMarketMetrics(marketData) {
    try {
      console.log('📊 Analyzing market metrics with GPU acceleration...');

      const inputData = {
        market_data: marketData,
        analysis_type: 'market_metrics',
        indicators: ['rsi', 'momentum', 'volatility', 'trend_strength'],
        timestamp: new Date().toISOString()
      };

      const inputFile = path.join(this.tempDir, `market_${Date.now()}.json`);
      await fs.writeFile(inputFile, JSON.stringify(inputData, null, 2));

      const result = await this.runPythonScript('gpu_analytics.py', inputFile);

      // Cleanup
      try {
        await fs.unlink(inputFile);
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError.message);
      }

      if (result.success) {
        // Transform to market-specific insights
        return {
          success: true,
          marketCondition: result.insights.market_assessment?.overall_bias || 'neutral',
          keySignals: result.insights.market_assessment?.key_signals || [],
          riskLevel: this.determineRiskLevel(result.insights),
          investmentImplication: this.generateInvestmentImplication(result.insights),
          technicalSummary: result.insights.market_assessment?.interpretation || 'Analysis completed',
          confidence: result.insights.market_assessment?.confidence_level || 'moderate',
          rawInsights: result.insights // For AI model consumption
        };
      } else {
        return {
          success: false,
          error: result.error,
          marketCondition: 'unknown'
        };
      }

    } catch (error) {
      console.error('Market metrics analysis failed:', error);
      return {
        success: false,
        error: error.message,
        marketCondition: 'error'
      };
    }
  }

  /**
   * Analyze sector rotation patterns
   */
  async analyzeSectorRotation(sectorData) {
    try {
      console.log('🔄 Analyzing sector rotation with GPU...');

      const inputData = {
        sector_performance: sectorData,
        analysis_type: 'sector_rotation',
        indicators: ['momentum', 'relative_strength', 'rotation_signals'],
        timestamp: new Date().toISOString()
      };

      const inputFile = path.join(this.tempDir, `sector_${Date.now()}.json`);
      await fs.writeFile(inputFile, JSON.stringify(inputData, null, 2));

      const result = await this.runPythonScript('gpu_analytics.py', inputFile);

      try {
        await fs.unlink(inputFile);
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError.message);
      }

      if (result.success) {
        return {
          success: true,
          rotationPhase: this.identifyRotationPhase(sectorData),
          leadingSectors: this.identifyLeadingSectors(sectorData),
          laggingSectors: this.identifyLaggingSectors(sectorData),
          rotationStrength: this.calculateRotationStrength(sectorData),
          investmentTheme: this.generateRotationTheme(sectorData),
          rawInsights: result.insights
        };
      } else {
        return {
          success: false,
          error: result.error,
          rotationPhase: 'unknown'
        };
      }

    } catch (error) {
      console.error('Sector rotation analysis failed:', error);
      return {
        success: false,
        error: error.message,
        rotationPhase: 'error'
      };
    }
  }

  /**
   * Run Python script and return parsed results
   */
  async runPythonScript(scriptName, inputFile) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.pythonPath, scriptName);
      const python = spawn('python', [scriptPath, inputFile], {
        cwd: this.pythonPath,
        env: { 
          ...process.env,
          PYTHONPATH: this.pythonPath,
          FORCE_CUDA: '1' // Force GPU usage
        }
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        const message = data.toString();
        stderr += message;
        
        // Log GPU status messages
        if (message.includes('GPU acceleration') || message.includes('CUDA')) {
          console.log('🎮 GPU:', message.trim());
        }
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            console.error('Raw output:', stdout);
            resolve({
              success: false,
              error: 'Failed to parse analysis results',
              raw_output: stdout
            });
          }
        } else {
          console.error(`Python script exited with code ${code}`);
          console.error('stderr:', stderr);
          resolve({
            success: false,
            error: `Analysis failed (exit code: ${code})`,
            details: stderr
          });
        }
      });

      python.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error(`Python execution failed: ${error.message}`));
      });
    });
  }

  /**
   * Helper methods for interpretation
   */
  determineRiskLevel(insights) {
    const riskFactors = [];
    
    if (insights.momentum_analysis?.momentum_state === 'overbought') {
      riskFactors.push('momentum_risk');
    }
    
    if (insights.volatility_analysis?.volatility_state === 'high_volatility_expansion') {
      riskFactors.push('volatility_risk');
    }
    
    if (insights.market_assessment?.overall_bias === 'bearish_technical_setup') {
      riskFactors.push('bearish_bias');
    }
    
    if (riskFactors.length >= 2) {
      return 'elevated';
    } else if (riskFactors.length === 1) {
      return 'moderate';
    } else {
      return 'normal';
    }
  }

  generateInvestmentImplication(insights) {
    const bias = insights.market_assessment?.overall_bias;
    const confidence = insights.market_assessment?.confidence_level;
    
    if (bias === 'bullish_technical_setup' && confidence === 'high') {
      return 'favorable_for_long_positions';
    } else if (bias === 'bearish_technical_setup' && confidence === 'high') {
      return 'defensive_positioning_advised';
    } else if (bias === 'mixed_technical_signals') {
      return 'selective_stock_picking_environment';
    } else {
      return 'neutral_wait_for_clarity';
    }
  }

  identifyRotationPhase(sectorData) {
    // Simplified rotation phase detection
    const sectors = Object.keys(sectorData);
    if (sectors.length < 2) return 'insufficient_data';
    
    const performances = sectors.map(s => sectorData[s]?.performance || 0);
    const spread = Math.max(...performances) - Math.min(...performances);
    
    if (spread > 5) {
      return 'active_rotation';
    } else if (spread > 2) {
      return 'moderate_rotation';
    } else {
      return 'low_rotation';
    }
  }

  identifyLeadingSectors(sectorData) {
    return Object.entries(sectorData)
      .filter(([sector, data]) => (data?.performance || 0) > 1)
      .map(([sector]) => sector)
      .slice(0, 3);
  }

  identifyLaggingSectors(sectorData) {
    return Object.entries(sectorData)
      .filter(([sector, data]) => (data?.performance || 0) < -1)
      .map(([sector]) => sector)
      .slice(0, 3);
  }

  calculateRotationStrength(sectorData) {
    const performances = Object.values(sectorData).map(d => d?.performance || 0);
    const volatility = this.calculateStandardDeviation(performances);
    
    if (volatility > 3) return 'strong';
    if (volatility > 1.5) return 'moderate';
    return 'weak';
  }

  generateRotationTheme(sectorData) {
    const leading = this.identifyLeadingSectors(sectorData);
    const lagging = this.identifyLaggingSectors(sectorData);
    
    if (leading.includes('technology') && lagging.includes('utilities')) {
      return 'growth_over_defensive';
    } else if (leading.includes('financials') && leading.includes('energy')) {
      return 'value_rotation';
    } else if (leading.includes('consumer_discretionary')) {
      return 'economic_optimism';
    } else {
      return 'mixed_themes';
    }
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Health check for Python GPU environment
   */
  async healthCheck() {
    try {
      const testData = {
        prices: [100, 101, 102, 101, 103, 102, 104, 103, 105, 104],
        indicators: ['rsi'],
        test: true
      };

      const inputFile = path.join(this.tempDir, `health_${Date.now()}.json`);
      await fs.writeFile(inputFile, JSON.stringify(testData));

      const result = await this.runPythonScript('gpu_analytics.py', inputFile);

      try {
        await fs.unlink(inputFile);
      } catch (cleanupError) {
        console.warn('Health check cleanup warning:', cleanupError.message);
      }

      return {
        status: result.success ? 'healthy' : 'error',
        gpu_available: result.gpu_accelerated || false,
        python_path: this.pythonPath,
        script_accessible: true,
        last_check: new Date().toISOString(),
        error: result.success ? null : result.error
      };

    } catch (error) {
      return {
        status: 'error',
        gpu_available: false,
        python_path: this.pythonPath,
        script_accessible: false,
        last_check: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Analyze data specifically for educational AI consumption
   * Returns structured insights instead of raw numbers
   */
  async analyzeForEducation({ context, data, calculationsNeeded }) {
    try {
      // Wait for initialization
      await this.initPromise;
      
      console.log(`📚 Analyzing ${context} for education with calculations: ${calculationsNeeded.join(', ')}`);

      // Debug logging for Python data structure
      console.log('🔍 Python input data structure:', {
        hasPrices: !!data?.prices,
        pricesLength: data?.prices?.length || 0,
        symbol: data?.symbol || 'unknown'
      });

      const inputData = {
        context,
        data,
        // Flatten marketData for Python script compatibility
        prices: data?.prices || [],
        price_data: data?.prices || [],
        symbol: data?.symbol || '^GSPC',  // Default to S&P 500 index, not SPY ETF
        calculations_needed: calculationsNeeded,
        analysis_type: 'education',
        focus: 'interpretations_not_numbers',
        timestamp: new Date().toISOString()
      };

      const inputFile = path.join(this.tempDir, `education_${Date.now()}.json`);
      await fs.writeFile(inputFile, JSON.stringify(inputData, null, 2));

      const result = await this.runPythonScript('gpu_analytics.py', inputFile);

      // Cleanup
      try {
        await fs.unlink(inputFile);
      } catch (cleanupError) {
        console.warn('Education analysis cleanup warning:', cleanupError.message);
      }

      if (result.success && result.insights) {
        // Use REAL Python insights directly - no fake transformations
        const educationalInsights = {
          ...result.insights, // Pass through ALL real Python insights
          // Add derived fields from real data
          market_state: result.insights.market_assessment?.overall_bias || 
                       result.insights.momentum_analysis?.momentum_state || 
                       'analyzing',
          trend_quality: result.insights.trend_momentum?.trend_strength || 
                        result.insights.trend_structure?.trend_consensus ||
                        'analyzing',
          risk_level: result.insights.volatility_analysis?.volatility_state || 
                     result.insights.market_assessment?.confidence_level ||
                     'analyzing',
          key_patterns: result.insights.market_assessment?.key_signals || 
                       result.insights.technical_patterns?.detected || 
                       ['real_technical_analysis_in_progress'],
          // Context-specific insights
          ...(context === 'sector_rotation' && {
            leading_sectors: result.insights.sector_analysis?.leaders || [],
            lagging_sectors: result.insights.sector_analysis?.laggards || [],
            rotation_strength: result.insights.sector_analysis?.rotation_strength || 'moderate'
          }),
          ...(context === 'technical_indicators' && {
            rsi_state: this.formatRSIWithValue(result.insights.momentum_analysis),
            trend_direction: this.formatTrendWithValue(result.insights.trend_momentum),
            key_levels: result.insights.support_resistance?.summary || 'none identified',
            volume_analysis: result.insights.volume?.interpretation || 'normal'
          }),
          ...(context === 'portfolio_analysis' && {
            sharpe_ratio: result.insights.risk_metrics?.sharpe_interpretation || 'average',
            diversification_level: result.insights.portfolio?.diversification_score || 'moderate',
            sector_risk: result.insights.portfolio?.concentration_risk || 'balanced',
            relative_performance: result.insights.performance?.vs_benchmark || 'in-line'
          })
        };

        return {
          success: true,
          insights: educationalInsights,
          source: 'python_gpu_analytics',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: result.error || 'Education analysis failed',
          insights: {}
        };
      }
    } catch (error) {
      console.error('❌ Education analysis failed:', error.message);
      return {
        success: false,
        error: error.message,
        insights: {}
      };
    }
  }

  // Helper methods for interpreting Python results
  interpretMarketState(insights) {
    if (!insights.market_assessment) return 'unknown';
    const bias = insights.market_assessment.overall_bias;
    return bias === 'bullish' ? 'strong uptrend' : 
           bias === 'bearish' ? 'downtrend' : 
           bias === 'neutral' ? 'sideways' : 'mixed signals';
  }

  interpretTrendQuality(insights) {
    if (!insights.trend_analysis) return 'unknown';
    const strength = insights.trend_analysis.strength;
    return strength > 0.7 ? 'strong' : 
           strength > 0.4 ? 'moderate' : 'weak';
  }

  interpretRiskLevel(insights) {
    if (!insights.risk_metrics) return 'moderate';
    const volatility = insights.risk_metrics.volatility_percentile;
    return volatility > 0.8 ? 'high' : 
           volatility > 0.5 ? 'elevated' : 
           volatility > 0.2 ? 'moderate' : 'low';
  }

  identifyKeyPatterns(insights) {
    const patterns = [];
    if (insights.technical_patterns) {
      patterns.push(...insights.technical_patterns.detected || []);
    }
    if (insights.market_assessment?.key_signals) {
      patterns.push(...insights.market_assessment.key_signals);
    }
    return patterns.slice(0, 5); // Limit to top 5 patterns
  }

  formatRSIWithValue(momentumData) {
    if (!momentumData || !momentumData.reference_value) return 'neutral';
    
    const rsiValue = momentumData.reference_value;
    const state = momentumData.momentum_state;
    
    // Format with specific current value + interpretation
    if (state === 'overbought') {
      return `RSI is currently ${rsiValue} - indicating overbought conditions`;
    } else if (state === 'oversold') {
      return `RSI is currently ${rsiValue} - indicating oversold conditions`;
    } else if (state === 'bullish_momentum') {
      return `RSI is currently ${rsiValue} - showing bullish momentum`;
    } else if (state === 'bearish_momentum') {
      return `RSI is currently ${rsiValue} - showing bearish momentum`;
    } else {
      return `RSI is currently ${rsiValue} - neutral momentum`;
    }
  }

  formatTrendWithValue(trendData) {
    if (!trendData) return 'sideways';
    
    const direction = trendData.momentum_direction || 'neutral';
    const strength = trendData.signal_strength || 0;
    
    // Format with specific trend strength + direction
    if (direction.includes('bullish')) {
      return `${direction} with ${Math.round(strength * 100)}% confidence`;
    } else if (direction.includes('bearish')) {
      return `${direction} with ${Math.round(strength * 100)}% confidence`;
    } else {
      return `sideways trend with ${Math.round(strength * 100)}% confidence`;
    }
  }
}

// Export singleton instance
export default new PythonGpuBridge();

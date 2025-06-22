// Python service integration for market data analysis
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Track service state
let pythonProcess = null;
let serviceStartTime = null;
let serviceRunning = false;
let startingUp = false;
let healthCheckInterval = null;

// Python service methods
const pythonService = {
  /**
   * Initialize the Python service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  initialize: async (forceRestart = false) => {
    if (serviceRunning && !forceRestart) {
      console.log('Python service is already running');
      return true;
    }
    
    if (startingUp) {
      console.log('Python service is already starting up');
      return false;
    }
    
    startingUp = true;
    
    try {
      // If process exists and force restart, kill it first
      if (pythonProcess && forceRestart) {
        console.log('Force restarting Python service...');
        pythonService.shutdown();
      }
      
      // Check if the service is already running by someone else
      try {
        const response = await axios.get(`${PYTHON_SERVICE_URL}/`, { timeout: 2000 });
        if (response.status === 200) {
          console.log('Python service is already running externally');
          serviceRunning = true;
          startingUp = false;
          
          // Set up health check interval
          if (!healthCheckInterval) {
            healthCheckInterval = setInterval(() => pythonService.checkHealth(), 30000); // Check every 30 seconds
          }
          
          return true;
        }
      } catch (error) {
        // Service is not running - start it
        console.log('Python service is not running, starting it now...');
      }
      
      // Determine Python app directory
      const pythonDir = path.resolve(__dirname, '..', '..', 'python');
      const appDir = path.join(pythonDir, 'app');
      
      // Check if the app directory exists
      if (!fs.existsSync(appDir)) {
        console.error(`Python app directory does not exist at: ${appDir}`);
        startingUp = false;
        return false;
      }
      
      // Start the Python process directly without batch files
      console.log(`Starting Python service directly with uvicorn...`);
      
      // First make sure dependencies are installed
      try {
        console.log('Installing Python dependencies...');
        const pipProcess = spawn('pip', ['install', '-r', path.join(pythonDir, 'requirements.txt')], {
          cwd: pythonDir,
          env: { ...process.env },
          stdio: 'pipe'
        });
        
        // Log pip output
        pipProcess.stdout.on('data', (data) => {
          console.log(`Pip: ${data.toString().trim()}`);
        });
        
        pipProcess.stderr.on('data', (data) => {
          console.error(`Pip error: ${data.toString().trim()}`);
        });
        
        // Wait for pip to finish
        await new Promise((resolve, reject) => {
          pipProcess.on('close', (code) => {
            if (code === 0) {
              console.log('Python dependencies installed successfully');
              resolve();
            } else {
              console.error(`Pip exited with code ${code}`);
              // Continue anyway, dependencies might already be installed
              resolve();
            }
          });
        });
      } catch (pipError) {
        console.error('Error installing Python dependencies:', pipError.message);
        // Continue anyway, dependencies might already be installed
      }
      
      // Now start the uvicorn server
      console.log('Starting uvicorn server...');
      pythonProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
        cwd: appDir,
        env: { ...process.env },
        stdio: 'pipe' // Capture output
      });
      
      // Handle process output
      pythonProcess.stdout.on('data', (data) => {
        console.log(`Python service: ${data.toString().trim()}`);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python service error: ${data.toString().trim()}`);
      });
      
      // Handle process exit
      pythonProcess.on('close', (code) => {
        console.log(`Python service exited with code ${code}`);
        pythonProcess = null;
        serviceRunning = false;
        
        // Clear health check interval
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
          healthCheckInterval = null;
        }
      });
      
      // Wait for the service to start
      serviceStartTime = Date.now();
      await pythonService.waitForService();
      
      // Set up health check interval
      if (!healthCheckInterval) {
        healthCheckInterval = setInterval(() => pythonService.checkHealth(), 30000); // Check every 30 seconds
      }
      
      console.log('Python service started successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Python service:', error.message);
      return false;
    } finally {
      startingUp = false;
    }
  },
  
  /**
   * Wait for the Python service to start
   * @returns {Promise<boolean>} Whether the service started successfully
   */
  waitForService: async () => {
    const startTime = Date.now();
    const timeout = 30000; // 30 seconds
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(`${PYTHON_SERVICE_URL}/`, { timeout: 2000 });
        if (response.status === 200) {
          serviceRunning = true;
          return true;
        }
      } catch (error) {
        // Service not ready yet, wait and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.error('Timed out waiting for Python service to start');
    return false;
  },
  
  /**
   * Check if the Python service is healthy
   * @returns {Promise<boolean>} Whether the service is healthy
   */
  checkHealth: async () => {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/`, { timeout: 2000 });
      serviceRunning = response.status === 200;
      return serviceRunning;
    } catch (error) {
      console.error('Python service health check failed:', error.message);
      serviceRunning = false;
      
      // Try to restart if it's been at least 5 minutes since the last start
      if (!startingUp && (!serviceStartTime || Date.now() - serviceStartTime > 300000)) {
        console.log('Attempting to restart Python service...');
        pythonService.initialize(true);
      }
      
      return false;
    }
  },
  
  /**
   * Run data analysis using the Python service
   * @param {Array} data The data to analyze
   * @param {string} analysisType The type of analysis to perform
   * @param {Object} parameters Additional parameters
   * @returns {Promise<Object>} The analysis results
   */
  runAnalysis: async (data, analysisType, parameters = {}) => {
    if (!serviceRunning && !startingUp) {
      await pythonService.initialize();
    }
    
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, {
          data,
          analysis_type: analysisType,
          parameters
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout
        });
        
        return response.data;
      } catch (error) {
        console.error(`Analysis failed (attempt ${retries + 1}/${MAX_RETRIES}):`, error.message);
        retries++;
        
        if (retries < MAX_RETRIES) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        } else {
          throw new Error(`Failed to run analysis after ${MAX_RETRIES} attempts: ${error.message}`);
        }
      }
    }
  },
  
  /**
   * Get chart recommendation based on data and user prompt
   * @param {Array} data The data to analyze
   * @param {string} userPrompt The user's prompt
   * @param {Object} additionalContext Additional context
   * @returns {Promise<Object>} The chart recommendation
   */
  getChartRecommendation: async (data, userPrompt, additionalContext = {}) => {
    if (!serviceRunning && !startingUp) {
      await pythonService.initialize();
    }
    
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const response = await axios.post(`${PYTHON_SERVICE_URL}/recommend-chart`, {
          data,
          user_prompt: userPrompt,
          additional_context: additionalContext
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout
        });
        
        return response.data;
      } catch (error) {
        console.error(`Chart recommendation failed (attempt ${retries + 1}/${MAX_RETRIES}):`, error.message);
        retries++;
        
        if (retries < MAX_RETRIES) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        } else {
          throw new Error(`Failed to get chart recommendation after ${MAX_RETRIES} attempts: ${error.message}`);
        }
      }
    }
  },
  
  /**
   * Shutdown the Python service
   */
  shutdown: () => {
    // Clear health check interval
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
    
    // Kill the Python process if it exists
    if (pythonProcess) {
      console.log('Shutting down Python service...');
      
      if (process.platform === 'win32') {
        // On Windows, we need to use taskkill to ensure all child processes are killed
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
      } else {
        // On Unix-like systems
        pythonProcess.kill('SIGTERM');
      }
      
      pythonProcess = null;
    }
    
    serviceRunning = false;
  },
  
  /**
   * Get the status of the Python service
   * @returns {Object} The service status
   */
  getStatus: () => {
    return {
      running: serviceRunning,
      startingUp,
      startTime: serviceStartTime,
      uptime: serviceStartTime ? Math.floor((Date.now() - serviceStartTime) / 1000) : 0,
      version: '1.0.0'
    };
  }
};

export default pythonService;
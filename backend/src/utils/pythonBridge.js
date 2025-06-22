// Replace the original pythonBridge.js with this working version
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

class PythonBridge {
  constructor() {
    this.pythonPath = 'python';
    this.scriptsPath = path.join(process.cwd(), 'python');
    this.isReady = null; // Will be set after first check
  }

  async checkPythonEnvironment() {
    try {
      console.log('🐍 Checking Python environment...');
      
      // Simple test that works
      const testScript = path.join(this.scriptsPath, 'test_imports_simple.py');
      const result = await this.runCommand('python', [testScript]);
      
      const isWorking = result.stdout.includes('ALL PACKAGES WORKING');
      this.isReady = isWorking;
      
      if (isWorking) {
        console.log('✅ Python environment ready');
      } else {
        console.log('❌ Python packages missing');
      }
      
      return isWorking;
    } catch (error) {
      console.error('❌ Python check failed:', error.message);
      this.isReady = false;
      return false;
    }
  }

  async runPythonAnalysis(scriptName, data) {
    try {
      // Check environment if not already checked
      if (this.isReady === null) {
        await this.checkPythonEnvironment();
      }
      
      if (!this.isReady) {
        throw new Error('Python environment not ready');
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
        console.warn('Warning: Could not clean up temp file');
      }
      
      console.log(`✅ Python analysis completed: ${scriptName}`);
      return output;
      
    } catch (error) {
      console.error(`❌ Python analysis failed (${scriptName}):`, error.message);
      throw error;
    }
  }

  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const cmd = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      cmd.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      cmd.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      cmd.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      cmd.on('error', (error) => {
        reject(error);
      });
    });
  }
}

const pythonBridge = new PythonBridge();
export default pythonBridge;

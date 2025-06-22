// pythonBridge-working.js - Simple working version
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

class PythonBridge {
  constructor() {
    this.pythonPath = 'python';
    this.scriptsPath = path.join(process.cwd(), 'python');
    this.isReady = false;
  }

  /**
   * WORKING: Simple Python environment check using temp file
   */
  async checkPythonEnvironment() {
    try {
      console.log('🐍 Checking Python environment...');
      
      // Check Python version first
      const versionResult = await this.runCommand('python', ['--version']);
      console.log('✅ Python version:', versionResult.stdout.trim());
      
      // Create a temporary test script instead of using -c
      const testScriptPath = path.join(this.scriptsPath, 'test_imports.py');
      const testScript = `#!/usr/bin/env python3
import sys
try:
    import numpy
    print("✅ numpy OK - version:", numpy.__version__)
except ImportError as e:
    print("❌ numpy MISSING:", str(e))
    sys.exit(1)

try:
    import pandas  
    print("✅ pandas OK - version:", pandas.__version__)
except ImportError as e:
    print("❌ pandas MISSING:", str(e))
    sys.exit(1)

try:
    import scipy
    print("✅ scipy OK - version:", scipy.__version__)
except ImportError as e:
    print("❌ scipy MISSING:", str(e))
    sys.exit(1)

try:
    import sklearn
    print("✅ sklearn OK - version:", sklearn.__version__)
except ImportError as e:
    print("❌ sklearn MISSING:", str(e))
    sys.exit(1)

print("✅ ALL PACKAGES WORKING")
`;
      
      // Write and run test script
      await fs.writeFile(testScriptPath, testScript);
      const packageCheck = await this.runCommand('python', [testScriptPath]);
      
      // Clean up test script
      await fs.unlink(testScriptPath);
      
      console.log(packageCheck.stdout);
      
      if (packageCheck.stdout.includes('ALL PACKAGES WORKING')) {
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
   * FIXED: Simple command execution
   */
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

// Create singleton instance
const pythonBridge = new PythonBridge();

export default pythonBridge;

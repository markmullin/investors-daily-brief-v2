/**
 * API KEY SECURITY SERVICE
 * Production-grade API key management and security
 * 
 * Think of this like a bank vault for your API keys:
 * 1. Encryption = Keys stored in encrypted format
 * 2. Rotation = Change keys periodically
 * 3. Validation = Verify keys are valid
 * 4. Audit Log = Track who uses keys
 * 5. Access Control = Limit who can see keys
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ENCRYPTION CONFIGURATION
 * Uses AES-256-GCM for strong encryption
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 64,
  iterations: 100000,
  digest: 'sha256'
};

/**
 * API KEY AUDIT LOG
 * Tracks all API key usage and changes
 */
class ApiKeyAuditLog {
  constructor() {
    this.logFile = path.join(__dirname, '../../../logs/api-key-audit.log');
    this.maxLogSize = 10 * 1024 * 1024; // 10MB
    this.rotationCount = 5;
  }
  
  async log(event, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      details,
      ip: details.ip || 'system',
      user: details.user || 'system',
      severity: this.getSeverity(event)
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      // Ensure log directory exists
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      
      // Check if rotation needed
      await this.rotateIfNeeded();
      
      // Append to log
      await fs.appendFile(this.logFile, logLine, 'utf8');
      
      // Log to console for critical events
      if (logEntry.severity === 'critical') {
        console.error(`🚨 [API_KEY_AUDIT] ${event}:`, details);
      } else if (logEntry.severity === 'warning') {
        console.warn(`⚠️ [API_KEY_AUDIT] ${event}:`, details);
      }
      
    } catch (error) {
      console.error('❌ [API_KEY_AUDIT] Failed to write audit log:', error.message);
    }
  }
  
  getSeverity(event) {
    const criticalEvents = ['KEY_COMPROMISED', 'UNAUTHORIZED_ACCESS', 'DECRYPTION_FAILED'];
    const warningEvents = ['KEY_ROTATION_DUE', 'INVALID_KEY_ATTEMPT', 'KEY_NEAR_EXPIRY'];
    
    if (criticalEvents.includes(event)) return 'critical';
    if (warningEvents.includes(event)) return 'warning';
    return 'info';
  }
  
  async rotateIfNeeded() {
    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size > this.maxLogSize) {
        // Rotate logs
        for (let i = this.rotationCount - 1; i > 0; i--) {
          const oldFile = `${this.logFile}.${i}`;
          const newFile = `${this.logFile}.${i + 1}`;
          
          try {
            await fs.rename(oldFile, newFile);
          } catch (err) {
            // File might not exist
          }
        }
        
        // Move current to .1
        await fs.rename(this.logFile, `${this.logFile}.1`);
      }
    } catch (error) {
      // Log file might not exist yet
    }
  }
  
  async getRecentEvents(count = 100) {
    try {
      const content = await fs.readFile(this.logFile, 'utf8');
      const lines = content.trim().split('\n');
      return lines
        .slice(-count)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .reverse();
    } catch (error) {
      return [];
    }
  }
}

/**
 * API KEY MANAGER
 * Handles encryption, storage, and validation of API keys
 */
class ApiKeyManager {
  constructor() {
    this.configFile = path.join(__dirname, '../../../config/api-keys.encrypted');
    this.auditLog = new ApiKeyAuditLog();
    this.masterKey = this.deriveMasterKey();
    this.keyRotationDays = 90; // Rotate keys every 90 days
    this.cache = new Map(); // In-memory cache for decrypted keys
  }
  
  /**
   * Derive master key from environment variable
   * In production, this should be stored in a secure key management service
   */
  deriveMasterKey() {
    const masterPassword = process.env.API_KEY_MASTER_PASSWORD || 'default-dev-password-change-this';
    
    if (masterPassword === 'default-dev-password-change-this') {
      console.warn('⚠️ [API_KEY_SECURITY] Using default master password! Set API_KEY_MASTER_PASSWORD env var');
    }
    
    // Derive key from password
    const salt = crypto.createHash('sha256').update('api-key-salt').digest();
    return crypto.pbkdf2Sync(
      masterPassword,
      salt,
      ENCRYPTION_CONFIG.iterations,
      ENCRYPTION_CONFIG.keyLength,
      ENCRYPTION_CONFIG.digest
    );
  }
  
  /**
   * Encrypt an API key
   */
  encrypt(plaintext) {
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONFIG.algorithm,
      this.masterKey,
      iv
    );
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    const combined = Buffer.concat([iv, tag, encrypted]);
    
    return combined.toString('base64');
  }
  
  /**
   * Decrypt an API key
   */
  decrypt(encryptedData) {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength);
      const tag = combined.slice(
        ENCRYPTION_CONFIG.ivLength,
        ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
      );
      const encrypted = combined.slice(
        ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
      );
      
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_CONFIG.algorithm,
        this.masterKey,
        iv
      );
      
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      this.auditLog.log('DECRYPTION_FAILED', { error: error.message });
      throw new Error('Failed to decrypt API key');
    }
  }
  
  /**
   * Store a new API key
   */
  async storeKey(service, apiKey, metadata = {}) {
    try {
      // Load existing keys
      const keys = await this.loadKeys();
      
      // Encrypt the key
      const encryptedKey = this.encrypt(apiKey);
      
      // Store with metadata
      keys[service] = {
        encrypted: encryptedKey,
        created: new Date().toISOString(),
        lastRotated: new Date().toISOString(),
        rotationDue: this.calculateRotationDate(),
        metadata: {
          ...metadata,
          keyLength: apiKey.length,
          keyPrefix: apiKey.substring(0, 4) + '****' // Store prefix for identification
        }
      };
      
      // Save to file
      await this.saveKeys(keys);
      
      // Clear cache
      this.cache.delete(service);
      
      // Audit log
      await this.auditLog.log('KEY_STORED', {
        service,
        keyPrefix: keys[service].metadata.keyPrefix
      });
      
      return true;
    } catch (error) {
      await this.auditLog.log('KEY_STORE_FAILED', {
        service,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Retrieve an API key
   */
  async getKey(service, requestInfo = {}) {
    try {
      // Check cache first
      if (this.cache.has(service)) {
        return this.cache.get(service);
      }
      
      // Load from file
      const keys = await this.loadKeys();
      
      if (!keys[service]) {
        await this.auditLog.log('KEY_NOT_FOUND', {
          service,
          ...requestInfo
        });
        return null;
      }
      
      // Check if rotation is due
      if (new Date(keys[service].rotationDue) < new Date()) {
        await this.auditLog.log('KEY_ROTATION_DUE', {
          service,
          rotationDue: keys[service].rotationDue
        });
      }
      
      // Decrypt key
      const decryptedKey = this.decrypt(keys[service].encrypted);
      
      // Cache for performance
      this.cache.set(service, decryptedKey);
      
      // Audit log
      await this.auditLog.log('KEY_ACCESSED', {
        service,
        ...requestInfo
      });
      
      return decryptedKey;
    } catch (error) {
      await this.auditLog.log('KEY_ACCESS_FAILED', {
        service,
        error: error.message,
        ...requestInfo
      });
      throw error;
    }
  }
  
  /**
   * Rotate an API key
   */
  async rotateKey(service, newApiKey, requestInfo = {}) {
    try {
      const keys = await this.loadKeys();
      
      if (!keys[service]) {
        throw new Error(`No existing key found for service: ${service}`);
      }
      
      // Backup old key
      keys[service].previousKeys = keys[service].previousKeys || [];
      keys[service].previousKeys.push({
        encrypted: keys[service].encrypted,
        rotatedAt: new Date().toISOString()
      });
      
      // Keep only last 3 old keys
      if (keys[service].previousKeys.length > 3) {
        keys[service].previousKeys.shift();
      }
      
      // Update with new key
      keys[service].encrypted = this.encrypt(newApiKey);
      keys[service].lastRotated = new Date().toISOString();
      keys[service].rotationDue = this.calculateRotationDate();
      keys[service].metadata.keyPrefix = newApiKey.substring(0, 4) + '****';
      
      // Save
      await this.saveKeys(keys);
      
      // Clear cache
      this.cache.delete(service);
      
      // Audit log
      await this.auditLog.log('KEY_ROTATED', {
        service,
        ...requestInfo
      });
      
      return true;
    } catch (error) {
      await this.auditLog.log('KEY_ROTATION_FAILED', {
        service,
        error: error.message,
        ...requestInfo
      });
      throw error;
    }
  }
  
  /**
   * Validate API key format
   */
  validateKeyFormat(service, apiKey) {
    const validationRules = {
      FMP: {
        pattern: /^[a-zA-Z0-9]{32}$/,
        minLength: 32,
        maxLength: 32
      },
      MISTRAL: {
        pattern: /^[a-zA-Z0-9-_]+$/,
        minLength: 20,
        maxLength: 100
      },
      FRED: {
        pattern: /^[a-f0-9]{32}$/,
        minLength: 32,
        maxLength: 32
      }
    };
    
    const rules = validationRules[service];
    if (!rules) {
      return { valid: true }; // No specific rules
    }
    
    if (apiKey.length < rules.minLength || apiKey.length > rules.maxLength) {
      return {
        valid: false,
        error: `Key length must be between ${rules.minLength} and ${rules.maxLength}`
      };
    }
    
    if (rules.pattern && !rules.pattern.test(apiKey)) {
      return {
        valid: false,
        error: 'Invalid key format'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Get key status and health
   */
  async getKeyStatus(service) {
    try {
      const keys = await this.loadKeys();
      const keyInfo = keys[service];
      
      if (!keyInfo) {
        return { exists: false };
      }
      
      const rotationDue = new Date(keyInfo.rotationDue);
      const daysUntilRotation = Math.ceil((rotationDue - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        exists: true,
        created: keyInfo.created,
        lastRotated: keyInfo.lastRotated,
        rotationDue: keyInfo.rotationDue,
        daysUntilRotation,
        rotationStatus: daysUntilRotation < 0 ? 'overdue' :
                       daysUntilRotation < 7 ? 'due_soon' : 'healthy',
        metadata: keyInfo.metadata
      };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }
  
  /**
   * Calculate next rotation date
   */
  calculateRotationDate() {
    const date = new Date();
    date.setDate(date.getDate() + this.keyRotationDays);
    return date.toISOString();
  }
  
  /**
   * Load keys from encrypted file
   */
  async loadKeys() {
    try {
      const content = await fs.readFile(this.configFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty
        return {};
      }
      throw error;
    }
  }
  
  /**
   * Save keys to encrypted file
   */
  async saveKeys(keys) {
    await fs.mkdir(path.dirname(this.configFile), { recursive: true });
    await fs.writeFile(this.configFile, JSON.stringify(keys, null, 2), 'utf8');
  }
  
  /**
   * Get audit log events
   */
  async getAuditLog(count = 100) {
    return this.auditLog.getRecentEvents(count);
  }
}

// Create singleton instance
const apiKeyManager = new ApiKeyManager();

/**
 * ENVIRONMENT VARIABLE VALIDATOR
 * Ensures all required API keys are present
 */
export async function validateEnvironmentKeys() {
  const requiredKeys = [
    { name: 'FMP_API_KEY', service: 'FMP' },
    { name: 'MISTRAL_API_KEY', service: 'MISTRAL' },
    { name: 'FRED_API_KEY', service: 'FRED' }
  ];
  
  const results = {
    valid: true,
    missing: [],
    invalid: []
  };
  
  for (const { name, service } of requiredKeys) {
    const value = process.env[name];
    
    if (!value) {
      results.missing.push(name);
      results.valid = false;
      continue;
    }
    
    // Validate format
    const validation = apiKeyManager.validateKeyFormat(service, value);
    if (!validation.valid) {
      results.invalid.push({
        name,
        error: validation.error
      });
      results.valid = false;
    }
  }
  
  return results;
}

/**
 * SECURE API KEY MIDDLEWARE
 * Adds encrypted API key management to requests
 */
export function secureApiKeyMiddleware() {
  return async (req, res, next) => {
    // Add secure key retrieval method to request
    req.getApiKey = async (service) => {
      return apiKeyManager.getKey(service, {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
    };
    
    // Add key status check
    req.checkKeyStatus = async (service) => {
      return apiKeyManager.getKeyStatus(service);
    };
    
    next();
  };
}

/**
 * API KEY MANAGEMENT ENDPOINTS
 * For admin use only - should be protected by authentication
 */
export const apiKeyRoutes = {
  // Get key status (no actual key exposed)
  getStatus: async (req, res) => {
    const { service } = req.params;
    const status = await apiKeyManager.getKeyStatus(service);
    res.json(status);
  },
  
  // Rotate a key
  rotateKey: async (req, res) => {
    const { service } = req.params;
    const { newKey } = req.body;
    
    if (!newKey) {
      return res.status(400).json({ error: 'New key required' });
    }
    
    const validation = apiKeyManager.validateKeyFormat(service, newKey);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    try {
      await apiKeyManager.rotateKey(service, newKey, {
        ip: req.ip,
        user: req.user?.id || 'admin'
      });
      
      res.json({ success: true, message: 'Key rotated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get audit log
  getAuditLog: async (req, res) => {
    const { count = 100 } = req.query;
    const events = await apiKeyManager.getAuditLog(parseInt(count));
    res.json(events);
  },
  
  // Validate environment
  validateEnvironment: async (req, res) => {
    const validation = await validateEnvironmentKeys();
    res.json(validation);
  }
};

export default apiKeyManager;

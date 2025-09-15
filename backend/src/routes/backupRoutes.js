import express from 'express';
import { redis } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

/**
 * *** BACKUP ADVANCED DATA TO FILE ***
 */
router.post('/backup/save-to-file', async (req, res) => {
  try {
    console.log('💾 [BACKUP] Saving advanced quality data to file...');
    
    const data = await redis.get('sp500:advanced_quality_fundamentals');
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'No advanced quality data found to backup',
        message: 'Run collection first'
      });
    }
    
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'data-backups');
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
    
    // Save with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sp500-advanced-quality-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    await fs.writeFile(filepath, data, 'utf8');
    
    // Also save a "latest" copy
    const latestPath = path.join(backupDir, 'sp500-advanced-quality-latest.json');
    await fs.writeFile(latestPath, data, 'utf8');
    
    const companies = JSON.parse(data);
    
    res.json({
      success: true,
      message: 'Advanced quality data backed up to file',
      backup: {
        filename,
        filepath,
        companiesCount: companies.length,
        fileSize: `${(Buffer.byteLength(data, 'utf8') / 1024 / 1024).toFixed(2)} MB`,
        timestamp: new Date().toISOString()
      },
      note: 'Data is now safe in both Redis cache and file backup'
    });
    
  } catch (error) {
    console.error('❌ [BACKUP] File backup failed:', error);
    res.status(500).json({
      success: false,
      error: 'File backup failed',
      details: error.message
    });
  }
});

/**
 * *** RESTORE ADVANCED DATA FROM FILE ***
 */
router.post('/backup/restore-from-file', async (req, res) => {
  try {
    console.log('📂 [RESTORE] Restoring advanced quality data from file...');
    
    const backupDir = path.join(process.cwd(), 'data-backups');
    const latestPath = path.join(backupDir, 'sp500-advanced-quality-latest.json');
    
    try {
      const data = await fs.readFile(latestPath, 'utf8');
      
      // Validate data
      const companies = JSON.parse(data);
      if (!Array.isArray(companies) || companies.length === 0) {
        throw new Error('Invalid backup data format');
      }
      
      // Restore to Redis
      await redis.setex('sp500:advanced_quality_fundamentals', 7 * 24 * 60 * 60, data);
      
      res.json({
        success: true,
        message: 'Advanced quality data restored from file backup',
        restored: {
          companiesCount: companies.length,
          dataTimestamp: companies[0]?.dataTimestamp,
          cacheExpiry: '7 days'
        },
        note: 'Your data is now restored to Redis cache'
      });
      
    } catch (fileError) {
      return res.status(404).json({
        success: false,
        error: 'No backup file found',
        message: 'Create a backup first using /backup/save-to-file'
      });
    }
    
  } catch (error) {
    console.error('❌ [RESTORE] File restore failed:', error);
    res.status(500).json({
      success: false,
      error: 'File restore failed',
      details: error.message
    });
  }
});

/**
 * *** TEST REDIS PERSISTENCE ***
 */
router.post('/backup/test-persistence', async (req, res) => {
  try {
    console.log('🧪 [TEST] Testing Redis persistence...');
    
    // Create test data
    const testKey = 'test:persistence:' + Date.now();
    const testData = {
      message: 'This is a persistence test',
      timestamp: new Date().toISOString(),
      companies: 503
    };
    
    // Save to Redis with persistence
    await redis.setex(testKey, 3600, JSON.stringify(testData)); // 1 hour
    
    // Force Redis save
    try {
      const saveResult = await redis.bgsave();
      console.log('💾 [TEST] Background save triggered:', saveResult);
    } catch (saveError) {
      console.log('⚠️ [TEST] Save warning:', saveError.message);
    }
    
    res.json({
      success: true,
      message: 'Persistence test completed',
      test: {
        testKey,
        testData,
        instructions: 'Restart server and check if test data survives',
        checkCommand: `curl "http://localhost:5000/api/fundamentals/backup/check-test?key=${testKey}"`
      },
      recommendation: 'Restart server now and run the check command to verify persistence'
    });
    
  } catch (error) {
    console.error('❌ [TEST] Persistence test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Persistence test failed',
      details: error.message
    });
  }
});

/**
 * *** CHECK PERSISTENCE TEST ***
 */
router.get('/backup/check-test', async (req, res) => {
  try {
    const testKey = req.query.key;
    if (!testKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing test key parameter'
      });
    }
    
    const testData = await redis.get(testKey);
    
    if (testData) {
      const parsed = JSON.parse(testData);
      res.json({
        success: true,
        message: '🎉 PERSISTENCE TEST PASSED! Data survived server restart',
        testData: parsed,
        note: 'Redis persistence is working correctly - your data is safe'
      });
    } else {
      res.json({
        success: false,
        message: '❌ PERSISTENCE TEST FAILED! Data was lost on restart',
        recommendation: 'Check Redis configuration and file permissions',
        fallback: 'Use file backups as additional safety measure'
      });
    }
    
  } catch (error) {
    console.error('❌ [CHECK] Persistence check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Persistence check failed',
      details: error.message
    });
  }
});

export default router;

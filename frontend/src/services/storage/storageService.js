/**
 * Enhanced storage service that uses IndexedDB for large datasets
 * and localStorage for smaller data
 */
class StorageService {
  constructor() {
    this.dbName = 'marketDashboardDB';
    this.dbVersion = 1;
    this.storeName = 'marketCache';
    this.db = null;
    this.dbReady = this.initDB();
    this.storagePrefix = 'market_dashboard_';
  }

  async initDB() {
    try {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          console.warn('IndexedDB not supported, using localStorage fallback');
          this.db = null;
          resolve(false);
          return;
        }
        
        const request = window.indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = (event) => {
          console.error('IndexedDB error:', event.target.error);
          this.db = null;
          resolve(false);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'key' });
          }
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          console.log('IndexedDB initialized successfully');
          resolve(true);
        };
      });
    } catch (e) {
      console.error('Error initializing IndexedDB:', e);
      return false;
    }
  }

  // Determine if data is large (>100KB)
  isLargeData(data) {
    const jsonData = JSON.stringify(data);
    return jsonData.length > 100 * 1024; // >100KB
  }

  // Generate a full key with prefix
  getFullKey(key) {
    return `${this.storagePrefix}${key}`;
  }

  // Store data in the appropriate storage
  async setItem(key, data, metadata = {}) {
    try {
      const fullKey = this.getFullKey(key);
      
      // Add timestamp and metadata
      const storeData = {
        data,
        timestamp: Date.now(),
        ...metadata
      };
      
      // Check if this is large data and IndexedDB is available
      if (this.isLargeData(data) && await this.dbReady) {
        await this.setIndexedDBItem(fullKey, storeData);
        // Store an indicator in localStorage that this key is in IndexedDB
        localStorage.setItem(`${fullKey}_location`, 'indexeddb');
        return true;
      } else {
        // Store smaller data in localStorage
        try {
          localStorage.setItem(fullKey, JSON.stringify(storeData));
          return true;
        } catch (storageError) {
          console.error('localStorage error, trying cleanup:', storageError);
          
          // If we got a quota error, try cleaning up old items
          if (storageError.name === 'QuotaExceededError' || 
              storageError.code === 22 || 
              storageError.message?.includes('quota')) {
            
            await this.cleanupOldItems();
            
            // Try again after cleanup
            try {
              localStorage.setItem(fullKey, JSON.stringify(storeData));
              return true;
            } catch (retryError) {
              // If still failing, try to use IndexedDB as a fallback
              if (await this.dbReady) {
                await this.setIndexedDBItem(fullKey, storeData);
                localStorage.setItem(`${fullKey}_location`, 'indexeddb');
                return true;
              }
              throw retryError;
            }
          }
          throw storageError;
        }
      }
    } catch (e) {
      console.error('Error storing data:', e);
      return false;
    }
  }

  // Cleanup old items when approaching quota
  async cleanupOldItems() {
    try {
      // Find all our cache items
      const cacheItems = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.storagePrefix) && !key.endsWith('_location')) {
          try {
            const valueStr = localStorage.getItem(key);
            const value = JSON.parse(valueStr);
            
            if (value && value.timestamp) {
              cacheItems.push({
                key,
                timestamp: value.timestamp
              });
            }
          } catch (e) {
            // Skip invalid items
            console.warn('Found invalid cache item:', key);
          }
        }
      }
      
      // Sort by age (oldest first)
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 30% of entries
      const removeCount = Math.max(1, Math.floor(cacheItems.length * 0.3));
      for (let i = 0; i < removeCount; i++) {
        const key = cacheItems[i].key;
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_location`);
        console.log('Removed old cache entry:', key);
      }
      
      return true;
    } catch (e) {
      console.error('Error during cache cleanup:', e);
      return false;
    }
  }

  // Store item in IndexedDB
  async setIndexedDBItem(key, data) {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put({ key, value: data });
      
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Get data from the appropriate storage
  async getItem(key) {
    try {
      const fullKey = this.getFullKey(key);
      
      // Check if this key is stored in IndexedDB
      const locationIndicator = localStorage.getItem(`${fullKey}_location`);
      
      if (locationIndicator === 'indexeddb') {
        return await this.getIndexedDBItem(fullKey);
      } else {
        // Try localStorage
        const dataStr = localStorage.getItem(fullKey);
        return dataStr ? JSON.parse(dataStr) : null;
      }
    } catch (e) {
      console.error('Error retrieving data:', e);
      return null;
    }
  }

  // Get item from IndexedDB
  async getIndexedDBItem(key) {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Remove an item from all storages
  async removeItem(key) {
    try {
      const fullKey = this.getFullKey(key);
      const locationIndicator = localStorage.getItem(`${fullKey}_location`);
      
      // Remove from IndexedDB if needed
      if (locationIndicator === 'indexeddb' && this.db) {
        await this.removeIndexedDBItem(fullKey);
      }
      
      // Always clean up localStorage
      localStorage.removeItem(fullKey);
      localStorage.removeItem(`${fullKey}_location`);
      
      return true;
    } catch (e) {
      console.error('Error removing data:', e);
      return false;
    }
  }

  // Remove item from IndexedDB
  async removeIndexedDBItem(key) {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(false);
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Clear all data
  async clear() {
    try {
      // Clear localStorage items with our prefix
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      }
      
      // Clear IndexedDB if available
      if (this.db) {
        await this.clearIndexedDB();
      }
      
      return true;
    } catch (e) {
      console.error('Error clearing all data:', e);
      return false;
    }
  }

  // Clear IndexedDB
  async clearIndexedDB() {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(false);
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

export default new StorageService();
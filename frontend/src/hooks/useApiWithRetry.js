import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for API calls with retry logic
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 */
export const useApiWithRetry = (apiFunction, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onSuccess = null,
    onError = null,
    dependencies = []
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (...args) => {
    let attempts = 0;
    
    const attemptApiCall = async () => {
      try {
        // Cancel any pending requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        setLoading(true);
        setError(null);
        
        // Pass abort signal to API function if it supports it
        const result = await apiFunction(...args, { 
          signal: abortControllerRef.current.signal 
        });
        
        if (mountedRef.current) {
          setData(result);
          setRetryCount(0);
          if (onSuccess) onSuccess(result);
        }
        
        return result;
      } catch (err) {
        // Don't retry on abort
        if (err.name === 'AbortError') {
          return;
        }
        
        attempts++;
        
        if (attempts <= maxRetries && mountedRef.current) {
          // Calculate delay with exponential backoff
          const delay = exponentialBackoff 
            ? retryDelay * Math.pow(2, attempts - 1)
            : retryDelay;
          
          console.warn(`API call failed, retrying in ${delay}ms... (Attempt ${attempts}/${maxRetries})`);
          setRetryCount(attempts);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the call
          return attemptApiCall();
        } else {
          // Max retries reached or component unmounted
          if (mountedRef.current) {
            setError(err);
            if (onError) onError(err);
          }
          throw err;
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    return attemptApiCall();
  }, [apiFunction, maxRetries, retryDelay, exponentialBackoff, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setRetryCount(0);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    data,
    loading,
    error,
    retryCount,
    execute,
    reset,
    cancel
  };
};

/**
 * Hook for automatic refetching with retry
 */
export const useAutoRefetch = (apiFunction, interval = 60000, options = {}) => {
  const api = useApiWithRetry(apiFunction, options);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    api.execute();

    // Set up interval for refetching
    intervalRef.current = setInterval(() => {
      api.execute();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, ...options.dependencies]);

  return api;
};

/**
 * Hook for handling multiple API calls with retry
 */
export const useMultipleApiWithRetry = (apiFunctions, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState({});

  const execute = useCallback(async () => {
    setLoading(true);
    setErrors({});
    
    const results = {};
    const errorResults = {};
    
    await Promise.all(
      Object.entries(apiFunctions).map(async ([key, apiFunction]) => {
        try {
          const hook = useApiWithRetry(apiFunction, options);
          const result = await hook.execute();
          results[key] = result;
        } catch (error) {
          errorResults[key] = error;
        }
      })
    );
    
    setData(results);
    setErrors(errorResults);
    setLoading(false);
    
    return { data: results, errors: errorResults };
  }, [apiFunctions, options]);

  return {
    data,
    loading,
    errors,
    execute,
    hasErrors: Object.keys(errors).length > 0
  };
};
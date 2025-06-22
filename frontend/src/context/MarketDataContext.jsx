import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { marketApi, macroeconomicApi, marketEnvironmentApi } from '../services/api';

// Action types for the reducer
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DATA: 'SET_DATA',
  SET_PARTIAL_DATA: 'SET_PARTIAL_DATA',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_REFRESHING: 'SET_REFRESHING',
  UPDATE_LAST_UPDATED: 'UPDATE_LAST_UPDATED'
};

// Initial state with granular loading states
const initialState = {
  // Data state
  marketData: [],
  sp500Data: [],
  sectorData: [],
  macroData: {},
  historicalPrices: {},
  relationshipData: {},
  marketEnvironmentScore: null,
  
  // Loading states - granular per section
  loading: {
    initial: true,
    marketData: false,
    sp500Data: false,
    sectorData: false,
    macroData: false,
    historicalData: false,
    relationshipData: false,
    marketEnvironment: false
  },
  
  // Error states - granular per section
  errors: {
    marketData: null,
    sp500Data: null,
    sectorData: null,
    macroData: null,
    historicalData: null,
    relationshipData: null,
    marketEnvironment: null
  },
  
  // Meta information
  lastUpdated: {
    marketData: null,
    sp500Data: null,
    sectorData: null,
    macroData: null,
    historicalData: null,
    relationshipData: null,
    marketEnvironment: null
  },
  
  // Refresh states
  refreshing: {
    marketData: false,
    sp500Data: false,
    sectorData: false,
    macroData: false,
    historicalData: false,
    relationshipData: false,
    marketEnvironment: false
  }
};

// Reducer to manage complex state updates
function marketDataReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.section]: action.isLoading
        }
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.section]: action.error
        },
        loading: {
          ...state.loading,
          [action.section]: false
        }
      };
    
    case ACTIONS.SET_DATA:
      return {
        ...state,
        [action.dataKey]: action.data,
        loading: {
          ...state.loading,
          [action.section]: false,
          initial: false
        },
        errors: {
          ...state.errors,
          [action.section]: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          [action.section]: new Date().toISOString()
        }
      };
    
    case ACTIONS.SET_PARTIAL_DATA:
      // For progressive loading - update data but keep loading state
      return {
        ...state,
        [action.dataKey]: action.data,
        errors: {
          ...state.errors,
          [action.section]: null
        }
      };
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.section]: null
        }
      };
    
    case ACTIONS.SET_REFRESHING:
      return {
        ...state,
        refreshing: {
          ...state.refreshing,
          [action.section]: action.isRefreshing
        }
      };
    
    case ACTIONS.UPDATE_LAST_UPDATED:
      return {
        ...state,
        lastUpdated: {
          ...state.lastUpdated,
          [action.section]: new Date().toISOString()
        }
      };
    
    default:
      return state;
  }
}

// Create the context
const MarketDataContext = createContext();

// Provider component
export function MarketDataProvider({ children }) {
  const [state, dispatch] = useReducer(marketDataReducer, initialState);
  const refreshTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Helper function to handle API calls with error handling
  const fetchData = useCallback(async (section, dataKey, fetchFunction, isRefresh = false) => {
    try {
      // Clear any existing errors
      dispatch({ type: ACTIONS.CLEAR_ERROR, section });
      
      // Set loading or refreshing state
      if (isRefresh) {
        dispatch({ type: ACTIONS.SET_REFRESHING, section, isRefreshing: true });
      } else {
        dispatch({ type: ACTIONS.SET_LOADING, section, isLoading: true });
      }

      const data = await fetchFunction();
      
      dispatch({
        type: ACTIONS.SET_DATA,
        section,
        dataKey,
        data
      });
      
      console.log(`✅ ${section} data fetched successfully`);
      
      // Clear refreshing state
      if (isRefresh) {
        dispatch({ type: ACTIONS.SET_REFRESHING, section, isRefreshing: false });
      }
      
    } catch (error) {
      console.error(`❌ Error fetching ${section}:`, error);
      
      dispatch({
        type: ACTIONS.SET_ERROR,
        section,
        error: error.message || `Failed to load ${section}`
      });
      
      // Clear refreshing state
      if (isRefresh) {
        dispatch({ type: ACTIONS.SET_REFRESHING, section, isRefreshing: false });
      }
    }
  }, []);

  // Fetch individual data sections
  const fetchMarketData = useCallback((isRefresh = false) => {
    return fetchData('marketData', 'marketData', async () => {
      const data = await marketApi.getData();
      return Array.isArray(data) ? 
        data.map(stock => ({
          symbol: stock.symbol,
          close: stock.price,
          change_p: stock.changePercent,
          name: stock.name,
          volume: stock.volume
        })) : [];
    }, isRefresh);
  }, [fetchData]);

  const fetchSP500Data = useCallback((isRefresh = false) => {
    return fetchData('sp500Data', 'sp500Data', async () => {
      const data = await marketApi.getSP500Top();
      return Array.isArray(data) ? 
        data.map(stock => ({
          symbol: stock.symbol,
          close: stock.price,
          change_p: stock.changePercent,
          name: stock.name,
          volume: stock.volume || 0
        })) : [];
    }, isRefresh);
  }, [fetchData]);

  const fetchSectorData = useCallback((isRefresh = false) => {
    return fetchData('sectorData', 'sectorData', async () => {
      const data = await marketApi.getSectors();
      return Array.isArray(data) ?
        data.map(sector => ({
          symbol: sector.symbol,
          name: sector.name,
          color: sector.color || '#1e40af',
          close: sector.price,
          change_p: sector.changePercent,
          changePercent: sector.changePercent,
          price: sector.price
        })) : [];
    }, isRefresh);
  }, [fetchData]);

  const fetchMacroData = useCallback((isRefresh = false) => {
    return fetchData('macroData', 'macroData', () => marketApi.getMacro(), isRefresh);
  }, [fetchData]);

  const fetchHistoricalData = useCallback(async (symbols, isRefresh = false) => {
    try {
      dispatch({ type: ACTIONS.CLEAR_ERROR, section: 'historicalData' });
      
      if (isRefresh) {
        dispatch({ type: ACTIONS.SET_REFRESHING, section: 'historicalData', isRefreshing: true });
      } else {
        dispatch({ type: ACTIONS.SET_LOADING, section: 'historicalData', isLoading: true });
      }

      console.log('Fetching batch historical data for', symbols.length, 'symbols');
      
      const batchHistorical = await marketApi.getBatchHistory(symbols, '1y');
      
      // Process batch results
      const histories = {};
      const relationshipHistories = {};
      
      for (const [symbol, result] of Object.entries(batchHistorical)) {
        const historyData = { 
          data: result.error ? [] : result.data, 
          period: '1y' 
        };
        
        // Add to main indices
        if (['SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US'].includes(symbol)) {
          histories[symbol] = historyData;
        }
        
        // Add to relationship data
        relationshipHistories[symbol] = historyData;
      }
      
      // Update both historical and relationship data
      dispatch({
        type: ACTIONS.SET_DATA,
        section: 'historicalData',
        dataKey: 'historicalPrices',
        data: histories
      });
      
      dispatch({
        type: ACTIONS.SET_DATA,
        section: 'relationshipData',
        dataKey: 'relationshipData',
        data: relationshipHistories
      });
      
      console.log('✅ Historical data fetched successfully');
      
      if (isRefresh) {
        dispatch({ type: ACTIONS.SET_REFRESHING, section: 'historicalData', isRefreshing: false });
      }
      
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      
      dispatch({
        type: ACTIONS.SET_ERROR,
        section: 'historicalData',
        error: error.message || 'Failed to load historical data'
      });
      
      if (isRefresh) {
        dispatch({ type: ACTIONS.SET_REFRESHING, section: 'historicalData', isRefreshing: false });
      }
    }
  }, []);

  // Initial data fetch with progressive loading
  const initializeData = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      // Start all basic data fetches in parallel
      const basicDataPromises = [
        fetchMarketData(),
        fetchSP500Data(),
        fetchSectorData(),
        fetchMacroData()
      ];
      
      await Promise.allSettled(basicDataPromises);
      
      // After basic data is loaded, fetch historical data
      const allSymbols = [
        'SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US',
        'TLT.US', 'EEM.US', 'EFA.US', 'IVE.US', 'IVW.US',
        'IBIT.US', 'GLD.US', 'BND.US', 'JNK.US', 'USO.US', 'UUP.US',
        'XLP.US', 'XLY.US', 'SMH.US', 'XSW.US'
      ];
      
      await fetchHistoricalData(allSymbols);
      
      const endTime = performance.now();
      console.log(`📊 Data initialization completed in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Error during data initialization:', error);
    }
  }, [fetchMarketData, fetchSP500Data, fetchSectorData, fetchMacroData, fetchHistoricalData]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    console.log('🔄 Refreshing all market data...');
    
    const startTime = performance.now();
    
    // Refresh basic data
    const basicRefreshPromises = [
      fetchMarketData(true),
      fetchSP500Data(true),
      fetchSectorData(true),
      fetchMacroData(true)
    ];
    
    await Promise.allSettled(basicRefreshPromises);
    
    // Refresh historical data
    const allSymbols = [
      'SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US',
      'TLT.US', 'EEM.US', 'EFA.US', 'IVE.US', 'IVW.US',
      'IBIT.US', 'GLD.US', 'BND.US', 'JNK.US', 'USO.US', 'UUP.US',
      'XLP.US', 'XLY.US', 'SMH.US', 'XSW.US'
    ];
    
    await fetchHistoricalData(allSymbols, true);
    
    const endTime = performance.now();
    console.log(`🔄 Data refresh completed in ${(endTime - startTime).toFixed(2)}ms`);
  }, [fetchMarketData, fetchSP500Data, fetchSectorData, fetchMacroData, fetchHistoricalData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    initializeData();
    
    const setupAutoRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshAllData();
        setupAutoRefresh(); // Set up the next refresh
      }, 300000); // 5 minutes
    };
    
    setupAutoRefresh();
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initializeData, refreshAllData]);

  // Retry functions for failed sections
  const retrySection = useCallback(async (section) => {
    switch (section) {
      case 'marketData':
        return fetchMarketData();
      case 'sp500Data':
        return fetchSP500Data();
      case 'sectorData':
        return fetchSectorData();
      case 'macroData':
        return fetchMacroData();
      case 'historicalData':
      case 'relationshipData':
        const allSymbols = [
          'SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US',
          'TLT.US', 'EEM.US', 'EFA.US', 'IVE.US', 'IVW.US',
          'IBIT.US', 'GLD.US', 'BND.US', 'JNK.US', 'USO.US', 'UUP.US',
          'XLP.US', 'XLY.US', 'SMH.US', 'XSW.US'
        ];
        return fetchHistoricalData(allSymbols);
      default:
        console.warn(`Unknown section for retry: ${section}`);
    }
  }, [fetchMarketData, fetchSP500Data, fetchSectorData, fetchMacroData, fetchHistoricalData]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    refreshAllData,
    retrySection,
    
    // Computed values
    isAnyLoading: Object.values(state.loading).some(loading => loading),
    hasAnyError: Object.values(state.errors).some(error => error !== null),
    
    // Filtered data
    mainIndices: state.marketData.filter((item) =>
      ['SPY', 'QQQ', 'DIA', 'IWM'].includes(item.symbol)
    )
  };

  return (
    <MarketDataContext.Provider value={contextValue}>
      {children}
    </MarketDataContext.Provider>
  );
}

// Custom hook to use the MarketDataContext
export function useMarketData() {
  const context = useContext(MarketDataContext);
  
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  
  return context;
}

// Hook for specific data sections with loading and error states
export function useMarketDataSection(section) {
  const context = useMarketData();
  
  return {
    data: context[section] || null,
    loading: context.loading[section] || false,
    error: context.errors[section] || null,
    refreshing: context.refreshing[section] || false,
    lastUpdated: context.lastUpdated[section] || null,
    retry: () => context.retrySection(section)
  };
}

export default MarketDataContext;

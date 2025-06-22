import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

/**
 * Hook to fetch overall market data
 * @returns {Object} Query result with data, loading state, and error
 */
export function useMarketData() {
  return useQuery({
    queryKey: ['market', 'data'],
    queryFn: () => apiClient.get('/market/data'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch sector performance data
 * @returns {Object} Query result with data, loading state, and error
 */
export function useSectorPerformance() {
  return useQuery({
    queryKey: ['market', 'sectors'],
    queryFn: () => apiClient.get('/market/sectors'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch macro economic metrics
 * @returns {Object} Query result with data, loading state, and error
 */
export function useMacroMetrics() {
  return useQuery({
    queryKey: ['market', 'macro'],
    queryFn: () => apiClient.get('/market/macro'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch the biggest market mover
 * @returns {Object} Query result with data, loading state, and error
 */
export function useMarketMover() {
  return useQuery({
    queryKey: ['market', 'mover'],
    queryFn: () => apiClient.get('/market/mover'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch market themes
 * @returns {Object} Query result with data, loading state, and error
 */
export function useMarketThemes() {
  return useQuery({
    queryKey: ['market', 'themes'],
    queryFn: () => apiClient.get('/market/themes'),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch market insights
 * @returns {Object} Query result with data, loading state, and error
 */
export function useMarketInsights() {
  return useQuery({
    queryKey: ['market', 'insights'],
    queryFn: () => apiClient.get('/market/insights'),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch market news
 * @returns {Object} Query result with data, loading state, and error
 */
export function useMarketNews() {
  return useQuery({
    queryKey: ['market', 'news'],
    queryFn: () => apiClient.get('/market/news'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch sector rotation data
 * @returns {Object} Query result with data, loading state, and error
 */
export function useSectorRotation() {
  return useQuery({
    queryKey: ['market', 'sector-rotation'],
    queryFn: () => apiClient.get('/market/sector-rotation'),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export default {
  useMarketData,
  useSectorPerformance,
  useMacroMetrics,
  useMarketMover,
  useMarketThemes,
  useMarketInsights,
  useMarketNews,
  useSectorRotation
};
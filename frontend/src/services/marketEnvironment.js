import { fetchWithConfig } from './api';

export const marketEnvironmentApi = {
  getScore: () => fetchWithConfig('/market-environment/score'),  // Removed extra /api/
};
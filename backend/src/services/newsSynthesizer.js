/**
 * DISABLED News Synthesizer Service
 * This service has been disabled to ensure only real API data is used
 */

class NewsSynthesizer {
  constructor() {
    console.log('News Synthesizer has been DISABLED to ensure only real API data is used');
  }
  
  async generateNews() {
    console.error('DISABLED: Synthetic news generation is disabled. Only real API data should be used.');
    throw new Error('Synthetic news generation is disabled. Only real API data should be used.');
  }
}

// Export singleton instance
export default new NewsSynthesizer();
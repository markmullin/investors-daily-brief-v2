/**
 * TEXT FORMATTER UTILITY - AI Response Cleaning for UI Display
 * 
 * Cleans AI-generated text for dashboard display by removing markdown symbols,
 * special characters, and formatting that doesn't belong in UI components.
 * 
 * Created to fix: Raw markdown symbols (###, **, etc.) displaying in UI
 */

/**
 * Clean AI response text for UI display
 * Removes markdown formatting and makes text readable for dashboard components
 * 
 * @param {string} text - Raw AI-generated text with potential markdown
 * @returns {string} - Clean, UI-ready text
 */
export function cleanAIResponseForUI(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    // Remove markdown headers (###, ####, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    
    // Remove bold markdown (**text**)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    
    // Remove italic markdown (*text*)
    .replace(/\*([^*]+)\*/g, '$1')
    
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    
    // Remove bullet point markdown (- item, * item)
    .replace(/^[\s]*[-*]\s+/gm, '• ')
    
    // Remove numbered list markdown (1. item, 2. item)
    .replace(/^[\s]*\d+\.\s+/gm, '• ')
    
    // Clean up excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    
    // Remove empty lines at start/end
    .trim()
    
    // Remove special characters that don't belong in UI (keep basic punctuation)
    .replace(/[^\w\s.,!?():'"-]/g, ' ')
    
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    
    // Ensure sentences end properly
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2');
}

/**
 * Make AI text more concise for dashboard display
 * Shortens lengthy explanations while preserving key information
 * 
 * @param {string} text - Clean text to make concise
 * @param {number} maxLength - Maximum character length (default: 500)
 * @returns {string} - Concise, dashboard-ready text
 */
export function makeTextConcise(text, maxLength = 500) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  // Find the last complete sentence within the limit
  const truncated = text.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.7) {
    // If we found a good sentence ending point, use it
    return truncated.substring(0, lastSentenceEnd + 1).trim();
  } else {
    // Otherwise, truncate at word boundary and add ellipsis
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace).trim() + '...';
  }
}

/**
 * Process AI content for specific dashboard components
 * Combines cleaning and conciseness for optimal UI display
 * 
 * @param {string} text - Raw AI text
 * @param {object} options - Processing options
 * @returns {string} - Processed text ready for UI
 */
export function processAIContentForUI(text, options = {}) {
  const {
    maxLength = 500,
    removeLineBreaks = false,
    preservePunctuation = true
  } = options;
  
  // Step 1: Clean markdown and formatting
  let cleaned = cleanAIResponseForUI(text);
  
  // Step 2: Remove line breaks if requested (for inline display)
  if (removeLineBreaks) {
    cleaned = cleaned.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  }
  
  // Step 3: Make concise if needed
  if (maxLength && cleaned.length > maxLength) {
    cleaned = makeTextConcise(cleaned, maxLength);
  }
  
  return cleaned.trim();
}

/**
 * Extract key insights from AI text
 * Finds the most important points for dashboard summary display
 * 
 * @param {string} text - AI-generated text
 * @returns {Array<string>} - Array of key insights (max 3)
 */
export function extractKeyInsights(text) {
  if (!text) return [];
  
  const cleaned = cleanAIResponseForUI(text);
  
  // Split into sentences
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Look for important indicators
  const importantPhrases = [
    'important', 'key', 'significant', 'should', 'recommend', 
    'consider', 'indicates', 'suggests', 'strong', 'weak'
  ];
  
  const insights = sentences
    .filter(sentence => {
      const lower = sentence.toLowerCase();
      return importantPhrases.some(phrase => lower.includes(phrase));
    })
    .slice(0, 3)
    .map(insight => insight.trim());
  
  return insights.length > 0 ? insights : sentences.slice(0, 2);
}

export default {
  cleanAIResponseForUI,
  makeTextConcise,
  processAIContentForUI,
  extractKeyInsights
};

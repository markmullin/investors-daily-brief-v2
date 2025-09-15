/**
 * ENHANCED Text Formatting Utilities - Fixed UI Issues July 2025
 * Converts markdown-like text from AI analysis into properly formatted HTML
 * 
 * ✅ ENHANCED: More aggressive markdown removal for clean AI Market Brief display
 * ✅ FIXED: Consistent formatting across all AI components
 * ✅ ADDED: Better # symbol removal for clean UI
 */

/**
 * Formats AI analysis text by converting markdown to properly styled text
 * ENHANCED: More aggressive markdown removal to prevent # symbols in UI
 * @param {string} text - Raw text with markdown formatting
 * @returns {string} - HTML formatted text
 */
export const formatAnalysisText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let formatted = text
    // ENHANCED: Remove ALL # headers completely (more aggressive)
    .replace(/#{1,6}\s*(.*?)$/gm, '<strong class="font-bold text-gray-900 block mb-2">$1</strong>')
    .replace(/#{1,6}/g, '') // Remove any remaining # symbols
    
    // Convert **bold** to strong tags
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
    
    // Convert bullet points (multiple formats)
    .replace(/^\s*[-•*]\s*(.*?)$/gm, '<li class="ml-4 mb-1 text-gray-700">$1</li>')
    
    // Handle numbered lists
    .replace(/^\s*\d+\.\s*(.*?)$/gm, '<li class="ml-4 mb-1 text-gray-700">$1</li>')
    
    // Convert double line breaks to paragraph breaks
    .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700">')
    
    // Convert single line breaks to <br> tags
    .replace(/\n/g, '<br/>')
    
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    
    // ENHANCED: Remove any remaining markdown symbols aggressively
    .replace(/#{1,6}/g, '') // Final # removal pass
    .replace(/\*{1,2}/g, '') // Remove remaining asterisks
    .replace(/_{1,2}/g, '') // Remove underscores
    .replace(/`{1,3}/g, '') // Remove backticks
    
    // Trim whitespace
    .trim();
  
  // Wrap in paragraph if not already wrapped
  if (!formatted.startsWith('<')) {
    formatted = `<p class="mb-3 text-gray-700">${formatted}</p>`;
  }
  
  // Clean up any empty paragraphs
  formatted = formatted
    .replace(/<p[^>]*>\s*<\/p>/g, '')
    .replace(/<br\/>\s*<br\/>/g, '<br/>');
  
  return formatted;
};

/**
 * ENHANCED: Card text formatter with aggressive markdown removal
 * @param {string} text - Raw text 
 * @returns {string} - Simple formatted text for cards
 */
export const formatCardText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove ALL markdown symbols aggressively
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^\s*[-•*]\s*/gm, '• ')
    
    // Remove line breaks
    .replace(/\n/g, ' ')
    
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    
    // FINAL CLEANUP: Remove any remaining special characters
    .replace(/[#*_`]/g, '')
    
    // Limit length for card display
    .substring(0, 150)
    .trim() + (text.length > 150 ? '...' : '');
};

/**
 * ENHANCED: Clean text for consistent display (removes ALL formatting)
 * Perfect for AI Market Brief display - no HTML or markdown
 * @param {string} text - Text to clean
 * @returns {string} - Clean text without any formatting
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text
    // Remove HTML tags first
    .replace(/<[^>]*>/g, '')
    
    // Remove ALL markdown symbols
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^\s*[-•*]\s*/gm, '')
    
    // Remove line breaks and special formatting
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    
    // FINAL AGGRESSIVE CLEANUP
    .replace(/[#*_`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
};

/**
 * NEW: Enhanced UI-ready text processor for AI Market Brief
 * Specifically designed for clean paragraph display without any HTML/markdown
 * @param {string} text - Input text from AI
 * @returns {string} - Clean text ready for UI display with proper paragraphs
 */
export const makeUIReady = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text
    // First pass: Remove HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Remove markdown headers completely
    .replace(/#{1,6}\s*/g, '')
    
    // Remove bold/italic markdown but keep content
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
    
    // Remove code blocks and inline code
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    
    // Remove link markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    
    // Clean up bullet points
    .replace(/^\s*[-•*]\s*/gm, '')
    .replace(/^\s*\d+\.\s*/gm, '')
    
    // Normalize line breaks - convert multiple to double (paragraph breaks)
    .replace(/\n{3,}/g, '\n\n')
    
    // Clean up extra spaces
    .replace(/\s{2,}/g, ' ')
    .replace(/[ \t]+$/gm, '') // Remove trailing spaces
    
    // Final cleanup of any remaining markdown symbols
    .replace(/[#*_`~]/g, '')
    .replace(/\\\\/g, '')
    
    // Ensure proper sentence spacing
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
    
    .trim();
  
  // Ensure paragraphs are properly spaced
  cleaned = cleaned
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .join('\n\n');
  
  console.log('🧹 makeUIReady: Text cleaned for AI Market Brief display');
  return cleaned;
};

/**
 * Creates a React component that renders formatted HTML safely
 * @param {string} htmlContent - HTML formatted content
 * @returns {object} - React component props for dangerouslySetInnerHTML
 */
export const createFormattedHTML = (htmlContent) => ({
  __html: htmlContent
});

/**
 * Formats bullet point lists into proper HTML lists
 * @param {array} items - Array of text items
 * @returns {string} - HTML formatted list
 */
export const formatList = (items) => {
  if (!Array.isArray(items) || items.length === 0) return '';
  
  const listItems = items
    .map(item => `<li class="mb-2 text-gray-700">${formatCardText(item)}</li>`)
    .join('');
  
  return `<ul class="list-disc list-inside space-y-1">${listItems}</ul>`;
};

/**
 * Extracts key insights from longer text for summary display
 * @param {string} text - Full analysis text
 * @param {number} maxInsights - Maximum number of insights to extract
 * @returns {array} - Array of key insight strings
 */
export const extractKeyInsights = (text, maxInsights = 3) => {
  if (!text || typeof text !== 'string') return [];
  
  // Split by common separators and filter out short/empty items
  const insights = text
    .split(/[.!?]\s+/)
    .filter(insight => insight.trim().length > 20)
    .slice(0, maxInsights)
    .map(insight => cleanText(insight.trim()));
  
  return insights;
};

/**
 * NEW: Smart AI content processor for consistent formatting
 * Handles different types of AI responses and ensures clean output
 * @param {string|object} content - AI response content
 * @param {string} type - Type of content ('analysis', 'card', 'list', 'ui-ready')
 * @returns {string} - Properly formatted content
 */
export const processAIContent = (content, type = 'analysis') => {
  if (!content) return '';
  
  // Handle different content types
  let textContent = '';
  if (typeof content === 'string') {
    textContent = content;
  } else if (content && content.text) {
    textContent = content.text;
  } else if (content && content.content) {
    textContent = content.content;
  } else {
    textContent = String(content);
  }
  
  // Apply appropriate formatting based on type
  switch (type) {
    case 'card':
      return formatCardText(textContent);
    case 'list':
      return formatList([textContent]);
    case 'clean':
      return cleanText(textContent);
    case 'ui-ready':
      return makeUIReady(textContent);
    default:
      return formatAnalysisText(textContent);
  }
};

/**
 * NEW: Enhanced processor specifically for AI Market Brief content
 * Ensures clean, readable text for the AI Insights component
 * @param {string} content - AI-generated market brief content
 * @returns {string} - Clean, paragraph-formatted text ready for display
 */
export const processMarketBriefContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  // Use makeUIReady for clean text, then format for display
  const cleanContent = makeUIReady(content);
  
  // Split into paragraphs and format for better readability
  const paragraphs = cleanContent
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
  
  // Join paragraphs with proper spacing for UI display
  return paragraphs.join('\n\n');
};

/**
 * NEW: Utility to ensure consistent text display across all components
 * Enhanced version that handles various AI content formats
 * @param {string} text - Input text
 * @returns {string} - UI-ready text without any markdown symbols
 */
export const makeUIReadyEnhanced = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // First pass: Basic cleaning
  let processed = makeUIReady(text);
  
  // Second pass: Additional enhancements for AI Market Brief
  processed = processed
    // Ensure proper capitalization after periods
    .replace(/\.\s*([a-z])/g, (match, letter) => '. ' + letter.toUpperCase())
    
    // Fix spacing around common financial terms
    .replace(/\s*%\s*/g, '% ')
    .replace(/\$\s+/g, '$')
    
    // Clean up any double punctuation
    .replace(/([.!?]){2,}/g, '$1')
    
    // Ensure proper spacing
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return processed;
};

console.log('✅ Enhanced text formatter loaded with AI Market Brief optimizations!');
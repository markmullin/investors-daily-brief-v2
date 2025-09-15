/**
 * Production Console Cleaner
 * Removes all console logs from frontend in production
 */

// Add this to your main.jsx or App.jsx
if (import.meta.env.PROD) {
  // Disable all console methods in production
  const noop = () => {};
  
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  console.trace = noop;
  
  // Only keep console.error for critical issues
  const originalError = console.error;
  console.error = (...args) => {
    // Only log critical errors, filter out React warnings
    const message = args[0]?.toString() || '';
    if (!message.includes('Warning:') && 
        !message.includes('DevTools') &&
        !message.includes('React')) {
      originalError.apply(console, args);
    }
  };
}
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context with a default value
const ViewModeContext = createContext({
  viewMode: 'basic',
  setViewMode: () => {}
});

export function ViewModeProvider({ children }) {
  // Initialize with localStorage value if available, otherwise 'basic'
  const [viewMode, setViewModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('viewMode');
      return saved ? saved : 'basic';
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return 'basic';
    }
  });

  // Safe setter function that handles potential errors
  const setViewMode = (mode) => {
    try {
      console.log(`Setting view mode to: ${mode}`);
      // Validate mode to prevent invalid values
      const validMode = (mode === 'advanced' || mode === 'basic') ? mode : 'basic';
      
      // Store in localStorage for persistence
      localStorage.setItem('viewMode', validMode);
      
      // Update state
      setViewModeState(validMode);
    } catch (e) {
      console.error('Error setting view mode:', e);
    }
  };

  // Return the context provider with the viewMode state and setter
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

// Custom hook to use the ViewModeContext
export function useViewMode() {
  const context = useContext(ViewModeContext);
  
  // Throw a helpful error if used outside of a provider
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  
  return context;
}
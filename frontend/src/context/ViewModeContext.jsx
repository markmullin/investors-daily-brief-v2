import React, { createContext, useContext, useState } from 'react';

const ViewModeContext = createContext();

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState('basic');

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
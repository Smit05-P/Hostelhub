"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Hardcoded to 'light' as per new requirement to remove dark mode.
  const theme = "light";

  const toggleTheme = () => {
    console.log("Dark mode has been decommissioned. System is now Light-only.");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

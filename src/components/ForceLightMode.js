"use client";

import { useEffect } from 'react';

/**
 * ForceLightMode component
 * This component, when mounted, ensures the 'dark' class is removed from the document element.
 * Use this on pages that should ALWAYS be in light mode (Landing, Login, Register).
 */
export default function ForceLightMode() {
  useEffect(() => {
    // Preserve the original theme to restore it later if needed, 
    // but for now, the requirement is these pages stay in light mode.
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
      document.documentElement.classList.remove('dark');
    }

    // Cleanup: We don't necessarily want to restore theme here because 
    // if we navigate to another light page, it might flicker.
    // Dashboard pages have their own theme logic in ThemeContext.
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * Suppresses React defaultProps deprecation warnings from third-party charting libraries
 * This is a temporary workaround until the libraries are updated
 */
export function WarningSuppressor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      
      console.error = (...args: any[]) => {
        // Filter out React defaultProps warnings from charting library
        if (
          typeof args[0] === 'string' &&
          (args[0].includes('Warning: Tooltip') ||
           args[0].includes('defaultProps') ||
           args[0].includes('Support for defaultProps') ||
           args[0].includes('will be removed from function components'))
        ) {
          return; // Suppress this specific warning
        }
        originalError.apply(console, args);
      };
      
      return () => {
        console.error = originalError;
      };
    }
  }, []);

  return null;
}


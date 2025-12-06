import { useEffect } from 'react';

interface UseSettingsSyncOptions {
  getSettings: () => void;
  checkInterval?: number;
}

/**
 * Hook to synchronize settings across tabs and listen for settings updates
 */
export function useSettingsSync({ getSettings, checkInterval = 2000 }: UseSettingsSyncOptions) {
  useEffect(() => {
    let lastCheckedTimestamp: string | null = null;
    
    const handleSettingsSaved = () => {
      getSettings();
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settingsUpdated') {
        getSettings();
        // Clear the flag after handling
        if (typeof window !== 'undefined') {
          localStorage.removeItem('settingsUpdated');
        }
      }
    };
    
    window.addEventListener('settingsSaved', handleSettingsSaved);
    window.addEventListener('storage', handleStorageChange);
    
    // Check localStorage once on mount for any pending updates
    if (typeof window !== 'undefined') {
      const lastUpdate = localStorage.getItem('settingsUpdated');
      if (lastUpdate) {
        lastCheckedTimestamp = lastUpdate;
        getSettings();
        // Clear the flag after handling
        localStorage.removeItem('settingsUpdated');
      }
    }
    
    // Also check localStorage periodically for cross-tab updates (but only if timestamp changed)
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const currentUpdate = localStorage.getItem('settingsUpdated');
        if (currentUpdate && currentUpdate !== lastCheckedTimestamp) {
          lastCheckedTimestamp = currentUpdate;
          getSettings();
          // Clear the flag after handling
          localStorage.removeItem('settingsUpdated');
        }
      }
    }, checkInterval);
    
    return () => {
      window.removeEventListener('settingsSaved', handleSettingsSaved);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [getSettings, checkInterval]);
}


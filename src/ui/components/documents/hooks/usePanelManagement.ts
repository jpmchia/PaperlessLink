import { useState, useEffect, useCallback } from 'react';

const DEFAULT_PANEL_WIDTH = 768;
const MIN_PANEL_WIDTH = 300;

/**
 * Hook to manage the document preview panel state and resizing
 */
export function usePanelManagement() {
  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_PANEL_WIDTH);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);

  // Load panel width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('documentsPanelWidth');
      if (saved) {
        const savedWidth = parseInt(saved, 10);
        const maxWidth = Math.round(window.innerWidth * 0.7);
        setPanelWidth(Math.min(savedWidth, maxWidth));
      } else {
        const defaultWidth = Math.max(400, Math.round(window.innerWidth * 0.3));
        setPanelWidth(defaultWidth);
      }
    }
  }, []);

  // Handle resize for right panel
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const minWidth = MIN_PANEL_WIDTH;
      const maxWidth = typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.7) : 1200;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      setPanelWidth(newWidth);
      if (typeof window !== 'undefined') {
        localStorage.setItem('documentsPanelWidth', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelWidth]);

  return {
    panelWidth,
    isPanelVisible,
    setIsPanelVisible,
    handleResizeStart,
  };
}


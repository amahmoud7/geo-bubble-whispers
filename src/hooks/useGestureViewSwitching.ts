import { useState, useCallback } from 'react';

type ViewMode = 'map' | 'split' | 'list';

export const useGestureViewSwitching = (initialViewMode: ViewMode = 'map') => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  const handlePinchGesture = useCallback((scale: number) => {
    // Pinch out (zoom out) to show split view
    if (scale < 0.8 && viewMode === 'map') {
      setViewMode('split');
    }
    // Pinch in (zoom in) to show map only
    else if (scale > 1.2 && viewMode === 'split') {
      setViewMode('map');
    }
  }, [viewMode]);

  const handleSwipeGesture = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    switch (direction) {
      case 'left':
        if (viewMode === 'map') setViewMode('split');
        else if (viewMode === 'split') setViewMode('list');
        break;
      case 'right':
        if (viewMode === 'list') setViewMode('split');
        else if (viewMode === 'split') setViewMode('map');
        break;
      case 'up':
        // Swipe up to show list view from any mode
        setViewMode('list');
        break;
      case 'down':
        // Swipe down to show map view from any mode
        setViewMode('map');
        break;
    }
  }, [viewMode]);

  const cycleViewMode = useCallback(() => {
    const modes: ViewMode[] = ['map', 'split', 'list'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  }, [viewMode]);

  return {
    viewMode,
    setViewMode,
    handlePinchGesture,
    handleSwipeGesture,
    cycleViewMode
  };
};
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SwipeGesturesProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
  className?: string;
  threshold?: number; // Minimum distance for swipe detection
  velocityThreshold?: number; // Minimum velocity for swipe detection
  preventDefaultTouchMoveTypes?: ('horizontal' | 'vertical' | 'all')[];
  disabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

const SwipeGestures: React.FC<SwipeGesturesProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
  className,
  threshold = 50,
  velocityThreshold = 0.3,
  preventDefaultTouchMoveTypes = [],
  disabled = false
}) => {
  const [startTouch, setStartTouch] = useState<TouchPoint | null>(null);
  const [currentTouch, setCurrentTouch] = useState<TouchPoint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTouchPoint = (touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now()
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || e.touches.length !== 1) return;
    
    const touch = getTouchPoint(e.touches[0]);
    setStartTouch(touch);
    setCurrentTouch(touch);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || e.touches.length !== 1 || !startTouch) return;
    
    const touch = getTouchPoint(e.touches[0]);
    setCurrentTouch(touch);

    const deltaX = touch.x - startTouch.x;
    const deltaY = touch.y - startTouch.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Prevent default scrolling based on swipe direction
    if (preventDefaultTouchMoveTypes.includes('all')) {
      e.preventDefault();
    } else if (preventDefaultTouchMoveTypes.includes('horizontal') && absDeltaX > absDeltaY) {
      e.preventDefault();
    } else if (preventDefaultTouchMoveTypes.includes('vertical') && absDeltaY > absDeltaX) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || !startTouch || !currentTouch) return;

    const deltaX = currentTouch.x - startTouch.x;
    const deltaY = currentTouch.y - startTouch.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const timeDelta = (currentTouch.timestamp - startTouch.timestamp) / 1000; // Convert to seconds
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / timeDelta;

    // Check if swipe meets threshold requirements
    const meetsDistanceThreshold = Math.max(absDeltaX, absDeltaY) >= threshold;
    const meetsVelocityThreshold = velocity >= velocityThreshold;

    if (meetsDistanceThreshold || meetsVelocityThreshold) {
      // Determine swipe direction based on the larger delta
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    // Reset touch tracking
    setStartTouch(null);
    setCurrentTouch(null);
  };

  const handleTouchCancel = () => {
    setStartTouch(null);
    setCurrentTouch(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn("touch-none", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        touchAction: preventDefaultTouchMoveTypes.includes('all') ? 'none' : 'auto'
      }}
    >
      {children}
    </div>
  );
};

export default SwipeGestures;
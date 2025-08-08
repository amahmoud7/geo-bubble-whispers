import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TouchableAreaProps {
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  disabled?: boolean;
  delayLongPress?: number;
  hitSlop?: number;
  testID?: string;
}

const TouchableArea: React.FC<TouchableAreaProps> = ({
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  children,
  className,
  activeClassName,
  disabled = false,
  delayLongPress = 500,
  hitSlop = 0,
  testID
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(true);
    onPressIn?.();

    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        setLongPressTimer(null);
      }, delayLongPress);
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(false);
    onPressOut?.();

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Check if touch ended within the element bounds for onPress
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    if (
      x >= rect.left - hitSlop &&
      x <= rect.right + hitSlop &&
      y >= rect.top - hitSlop &&
      y <= rect.bottom + hitSlop
    ) {
      onPress?.();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled) return;
    
    // Cancel long press if finger moves too much
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    if (
      x < rect.left - hitSlop ||
      x > rect.right + hitSlop ||
      y < rect.top - hitSlop ||
      y > rect.bottom + hitSlop
    ) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setIsPressed(false);
    }
  };

  const handleTouchCancel = () => {
    if (disabled) return;
    
    setIsPressed(false);
    onPressOut?.();
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Mouse events for web compatibility
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    setIsPressed(true);
    onPressIn?.();

    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        setLongPressTimer(null);
      }, delayLongPress);
      setLongPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (disabled) return;
    
    setIsPressed(false);
    onPressOut?.();

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    onPress?.();
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    
    setIsPressed(false);
    onPressOut?.();
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div
      className={cn(
        "cursor-pointer select-none transition-all duration-150",
        // Ensure minimum touch target size (44px as per iOS guidelines)
        "min-w-[44px] min-h-[44px] flex items-center justify-center",
        disabled && "opacity-50 cursor-not-allowed",
        isPressed && (activeClassName || "opacity-70 scale-95"),
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      data-testid={testID}
      style={{
        WebkitTapHighlightColor: 'transparent', // Remove default tap highlight
        userSelect: 'none',
        touchAction: 'manipulation' // Improve touch response
      }}
    >
      {children}
    </div>
  );
};

export default TouchableArea;
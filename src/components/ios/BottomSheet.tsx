import React, { useEffect, useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Array of percentages (0-1) for snap positions
  initialSnap?: number; // Index of initial snap point
  title?: string;
  showHandle?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  contentClassName?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  snapPoints = [0.4, 0.7, 0.95],
  initialSnap = 0,
  title,
  showHandle = true,
  closeOnBackdropClick = true,
  className,
  contentClassName
}) => {
  const controls = useAnimation();
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const snapToPoint = (snapIndex: number) => {
    const snapPoint = snapPoints[snapIndex];
    const windowHeight = window.innerHeight;
    const targetY = windowHeight * (1 - snapPoint);
    
    controls.start({
      y: targetY,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    });
    
    setCurrentSnap(snapIndex);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const windowHeight = window.innerHeight;
    const currentY = info.point.y;
    const velocity = info.velocity.y;
    
    // Find the closest snap point
    let closestSnapIndex = 0;
    let minDistance = Infinity;
    
    snapPoints.forEach((snapPoint, index) => {
      const snapY = windowHeight * (1 - snapPoint);
      const distance = Math.abs(currentY - snapY);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSnapIndex = index;
      }
    });
    
    // If dragging down with high velocity, close or go to lower snap point
    if (velocity > 500) {
      if (closestSnapIndex === 0) {
        onClose();
        return;
      } else {
        closestSnapIndex = Math.max(0, closestSnapIndex - 1);
      }
    }
    
    // If dragging up with high velocity, go to higher snap point
    if (velocity < -500) {
      closestSnapIndex = Math.min(snapPoints.length - 1, closestSnapIndex + 1);
    }
    
    snapToPoint(closestSnapIndex);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isDragging) setIsDragging(true);
    
    // Prevent dragging above the highest snap point
    const windowHeight = window.innerHeight;
    const maxY = windowHeight * (1 - snapPoints[snapPoints.length - 1]);
    const minY = windowHeight * 0.05; // 5% from top
    
    const constrainedY = Math.max(minY, Math.min(windowHeight, info.point.y));
    controls.set({ y: constrainedY });
  };

  useEffect(() => {
    if (isOpen) {
      snapToPoint(initialSnap);
    } else {
      controls.start({
        y: window.innerHeight,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
    }
  }, [isOpen, controls, initialSnap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      
      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        className={cn(
          "absolute left-0 right-0 bg-white rounded-t-3xl shadow-xl",
          "flex flex-col overflow-hidden",
          className
        )}
        style={{
          bottom: 0,
          height: '100vh',
          touchAction: 'none'
        }}
        animate={controls}
        drag="y"
        dragConstraints={{ top: 0, bottom: window.innerHeight }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        initial={{ y: window.innerHeight }}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
        )}
        
        {/* Title */}
        {title && (
          <div className="px-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        )}
        
        {/* Content */}
        <div 
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            contentClassName
          )}
          style={{ touchAction: 'pan-y' }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default BottomSheet;
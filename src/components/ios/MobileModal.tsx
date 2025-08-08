import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TouchableArea from './TouchableArea';
import SwipeGestures from './SwipeGestures';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnSwipeDown?: boolean;
  className?: string;
  contentClassName?: string;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  presentationStyle = 'pageSheet',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnSwipeDown = true,
  className,
  contentClassName
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const getModalVariants = () => {
    switch (presentationStyle) {
      case 'fullScreen':
        return {
          hidden: { y: '100%' },
          visible: { y: 0 },
          exit: { y: '100%' }
        };
      case 'formSheet':
        return {
          hidden: { y: '100%', scale: 0.95 },
          visible: { y: 0, scale: 1 },
          exit: { y: '100%', scale: 0.95 }
        };
      case 'pageSheet':
      default:
        return {
          hidden: { y: '100%' },
          visible: { y: '10%' },
          exit: { y: '100%' }
        };
    }
  };

  const getContainerClass = () => {
    switch (presentationStyle) {
      case 'fullScreen':
        return "fixed inset-0 bg-white";
      case 'formSheet':
        return "fixed inset-x-4 bottom-4 top-20 bg-white rounded-t-3xl shadow-2xl";
      case 'pageSheet':
      default:
        return "fixed inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl shadow-2xl";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        {presentationStyle !== 'fullScreen' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />
        )}

        {/* Modal Content */}
        <SwipeGestures
          onSwipeDown={closeOnSwipeDown ? onClose : undefined}
          preventDefaultTouchMoveTypes={['vertical']}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getModalVariants()}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            className={cn(
              getContainerClass(),
              "flex flex-col overflow-hidden",
              className
            )}
          >
            {/* Handle for swipe gesture */}
            {presentationStyle !== 'fullScreen' && (
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="w-8">
                  {/* Left spacer */}
                </div>
                
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 text-center">
                    {title}
                  </h2>
                )}
                
                <div className="w-8 flex justify-end">
                  {showCloseButton && (
                    <TouchableArea
                      onPress={onClose}
                      className="p-2 rounded-full bg-gray-100"
                    >
                      <X size={18} className="text-gray-600" />
                    </TouchableArea>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div 
              className={cn(
                "flex-1 overflow-y-auto overscroll-contain",
                contentClassName
              )}
            >
              {children}
            </div>
          </motion.div>
        </SwipeGestures>
      </div>
    </AnimatePresence>
  );
};

export default MobileModal;
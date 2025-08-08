import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import TouchableArea from './TouchableArea';

interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
  className?: string;
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  message,
  options,
  cancelLabel = 'Cancel',
  className
}) => {
  const handleOptionPress = (option: ActionSheetOption) => {
    if (!option.disabled) {
      option.onPress();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
        />

        {/* Action Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200
          }}
          className={cn(
            "absolute bottom-0 left-4 right-4 mb-4 space-y-2",
            "pb-safe-area-bottom",
            className
          )}
        >
          {/* Main options container */}
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            {(title || message) && (
              <div className="px-6 py-4 text-center border-b border-gray-100">
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {title}
                  </h3>
                )}
                {message && (
                  <p className="text-sm text-gray-600">
                    {message}
                  </p>
                )}
              </div>
            )}

            {/* Options */}
            <div className="divide-y divide-gray-100">
              {options.map((option, index) => (
                <TouchableArea
                  key={index}
                  onPress={() => handleOptionPress(option)}
                  className={cn(
                    "flex items-center px-6 py-4 min-h-[56px]",
                    option.disabled && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {option.icon && (
                      <div className={cn(
                        option.destructive ? "text-red-600" : "text-gray-600"
                      )}>
                        {option.icon}
                      </div>
                    )}
                    <span className={cn(
                      "text-base font-medium text-center flex-1",
                      option.destructive ? "text-red-600" : "text-blue-600",
                      option.disabled && "text-gray-400"
                    )}>
                      {option.label}
                    </span>
                  </div>
                </TouchableArea>
              ))}
            </div>
          </div>

          {/* Cancel button */}
          <div className="bg-white rounded-2xl">
            <TouchableArea
              onPress={onClose}
              className="flex items-center justify-center px-6 py-4 min-h-[56px]"
            >
              <span className="text-base font-semibold text-blue-600">
                {cancelLabel}
              </span>
            </TouchableArea>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ActionSheet;
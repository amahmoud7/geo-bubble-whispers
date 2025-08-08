import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import TouchableArea from './TouchableArea';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          {...props}
          className={cn(
            // Base styles
            "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl",
            "text-base text-gray-900 placeholder-gray-500",
            "transition-colors duration-200",
            // Focus styles
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            // Error styles
            error && "border-red-300 bg-red-50 focus:ring-red-500",
            // Icon padding
            leftIcon && "pl-10",
            rightIcon && "pr-12",
            // Ensure minimum touch target
            "min-h-[44px]",
            className
          )}
          style={{
            fontSize: '16px', // Prevent zoom on iOS
            WebkitAppearance: 'none',
            borderRadius: '12px'
          }}
        />
        
        {rightIcon && (
          <TouchableArea
            onPress={onRightIconPress}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <div className="text-gray-400 p-1">
              {rightIcon}
            </div>
          </TouchableArea>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface MobileTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const MobileTextArea: React.FC<MobileTextAreaProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize functionality
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      };
      
      textarea.addEventListener('input', adjustHeight);
      adjustHeight(); // Initial adjustment
      
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, []);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <textarea
        ref={textareaRef}
        {...props}
        className={cn(
          // Base styles
          "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl",
          "text-base text-gray-900 placeholder-gray-500",
          "transition-colors duration-200 resize-none",
          // Focus styles
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          // Error styles
          error && "border-red-300 bg-red-50 focus:ring-red-500",
          // Minimum height
          "min-h-[100px]",
          className
        )}
        style={{
          fontSize: '16px', // Prevent zoom on iOS
          WebkitAppearance: 'none',
          borderRadius: '12px'
        }}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800";
      case 'secondary':
        return "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300";
      case 'destructive':
        return "bg-red-600 text-white hover:bg-red-700 active:bg-red-800";
      case 'ghost':
        return "bg-transparent text-blue-600 hover:bg-blue-50 active:bg-blue-100";
      default:
        return "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return "px-4 py-2 text-sm min-h-[36px]";
      case 'md':
        return "px-6 py-3 text-base min-h-[44px]";
      case 'lg':
        return "px-8 py-4 text-lg min-h-[52px]";
      default:
        return "px-6 py-3 text-base min-h-[44px]";
    }
  };

  return (
    <TouchableArea
      onPress={!disabled && !loading ? props.onClick as any : undefined}
      className={cn(
        // Base styles
        "rounded-xl font-semibold transition-colors duration-200",
        "flex items-center justify-center gap-2",
        // Variant styles
        getVariantStyles(),
        // Size styles
        getSizeStyles(),
        // Disabled styles
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading && (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && leftIcon && leftIcon}
      {children}
      {!loading && rightIcon && rightIcon}
    </TouchableArea>
  );
};

interface MobileFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export const MobileForm: React.FC<MobileFormProps> = ({
  children,
  onSubmit,
  className
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-4", className)}
      noValidate // We'll handle validation ourselves
    >
      {children}
    </form>
  );
};

// iOS-style segmented control
interface SegmentedControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className
}) => {
  return (
    <div className={cn(
      "flex bg-gray-100 p-1 rounded-xl",
      className
    )}>
      {options.map((option) => (
        <TouchableArea
          key={option.value}
          onPress={() => onChange(option.value)}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-center text-sm font-medium transition-all duration-200",
            value === option.value
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600"
          )}
        >
          {option.label}
        </TouchableArea>
      ))}
    </div>
  );
};
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  leftButton?: 'back' | 'close' | 'none';
  rightButton?: React.ReactNode;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  className?: string;
  transparent?: boolean;
  large?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  leftButton = 'back',
  rightButton,
  onLeftClick,
  onRightClick,
  className,
  transparent = false,
  large = false
}) => {
  const navigate = useNavigate();

  const handleLeftClick = () => {
    if (onLeftClick) {
      onLeftClick();
    } else {
      navigate(-1);
    }
  };

  const renderLeftButton = () => {
    if (leftButton === 'none') return null;

    const Icon = leftButton === 'close' ? X : ChevronLeft;
    
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLeftClick}
        className="h-11 w-11 rounded-full active:bg-gray-100"
      >
        <Icon size={24} className="text-blue-600" />
      </Button>
    );
  };

  const renderRightButton = () => {
    if (!rightButton) return <div className="w-11" />; // Spacer for centering

    if (React.isValidElement(rightButton)) {
      return rightButton;
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onRightClick}
        className="h-11 w-11 rounded-full active:bg-gray-100"
      >
        <MoreHorizontal size={24} className="text-blue-600" />
      </Button>
    );
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 safe-area-inset-top",
        transparent ? "bg-transparent" : "bg-white border-b border-gray-200",
        large ? "h-24 pt-safe-area-top" : "h-16 pt-safe-area-top",
        className
      )}
    >
      <div className="flex items-center justify-start w-11">
        {renderLeftButton()}
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <h1 
          className={cn(
            "font-semibold text-center text-gray-900 truncate px-4",
            large ? "text-2xl" : "text-lg"
          )}
        >
          {title}
        </h1>
      </div>
      
      <div className="flex items-center justify-end w-11">
        {renderRightButton()}
      </div>
    </div>
  );
};

export default MobileHeader;
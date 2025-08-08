import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import TabNavigator from './TabNavigator';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  showTabBar?: boolean;
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
  backgroundColor?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  className,
  showTabBar = true,
  safeAreaTop = true,
  safeAreaBottom = true,
  backgroundColor = 'bg-white'
}) => {
  const isMobile = useIsMobile();

  return (
    <div 
      className={cn(
        "flex flex-col h-screen w-full overflow-hidden",
        backgroundColor,
        className
      )}
    >
      {/* Safe area top spacing */}
      {safeAreaTop && (
        <div className="safe-area-inset-top bg-inherit" />
      )}

      {/* Main content area */}
      <div 
        className={cn(
          "flex-1 relative overflow-hidden",
          showTabBar && isMobile && "pb-20" // Account for tab bar height
        )}
      >
        {children}
      </div>

      {/* Tab navigation for mobile */}
      {showTabBar && isMobile && <TabNavigator />}

      {/* Safe area bottom spacing */}
      {safeAreaBottom && (
        <div className="safe-area-inset-bottom bg-inherit" />
      )}
    </div>
  );
};

// Higher-order component for easy wrapping
export const withMobileLayout = <P extends object>(
  Component: React.ComponentType<P>,
  layoutProps?: Partial<MobileLayoutProps>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <MobileLayout {...layoutProps}>
      <Component {...props} />
    </MobileLayout>
  );

  WrappedComponent.displayName = `withMobileLayout(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default MobileLayout;
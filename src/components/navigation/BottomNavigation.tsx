import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCenter?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, isCenter = false, onClick }) => {
  const baseClasses = "flex flex-col items-center justify-center text-xs font-medium transition-all duration-200";
  const activeClasses = "text-lo-electric-blue";
  const inactiveClasses = "text-lo-gray-400 hover:text-lo-gray-600";
  const centerClasses = isCenter 
    ? "bg-lo-electric-blue text-white rounded-full w-16 h-16 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 border-none" 
    : "py-2 px-1 min-h-[44px] min-w-[44px]";

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  // For center button with onClick, use Button instead of Link to prevent navigation
  if (isCenter && onClick) {
    return (
      <Button
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center border-0 p-0 hover:bg-lo-electric-blue",
          centerClasses
        )}
        variant="ghost"
      >
        {icon}
      </Button>
    );
  }

  // For center button without onClick, use Link
  if (isCenter) {
    return (
      <Link 
        to={to}
        className={cn(
          "flex items-center justify-center",
          centerClasses
        )}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Link 
      to={to}
      onClick={handleClick}
      className={cn(
        baseClasses,
        centerClasses,
        isActive ? activeClasses : inactiveClasses
      )}
    >
      {icon}
      <span className="mt-1.5 text-[11px] font-normal">{label}</span>
    </Link>
  );
};

interface BottomNavigationProps {
  className?: string;
  onPostClick?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className, onPostClick }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/home' && (location.pathname === '/' || location.pathname === '/home'));
  };

  const navItems = [
    {
      to: '/home',
      icon: <Home className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Home',
      isActive: isActive('/home')
    },
    {
      to: '/explore',
      icon: <Compass className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Discover',
      isActive: isActive('/explore')
    },
    {
      to: '/post', // This will be ignored when onClick is present
      icon: <Plus className="h-7 w-7" strokeWidth={2.5} />,
      label: 'Create',
      isActive: false,
      isCenter: true,
      onClick: onPostClick
    },
    {
      to: '/inbox',
      icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Inbox',
      isActive: isActive('/inbox')
    },
    {
      to: '/profile',
      icon: <User className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Profile',
      isActive: isActive('/profile')
    }
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-lo-midnight/95 backdrop-blur-xl border-t border-lo-gray-800",
      "safe-area-inset-bottom",
      className
    )}>
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item, index) => (
          <NavItem
            key={index}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive}
            isCenter={item.isCenter}
            onClick={item.onClick}
          />
        ))}
      </div>
      
      {/* Safe area padding for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-lo-midnight" />
    </nav>
  );
};

export default BottomNavigation;
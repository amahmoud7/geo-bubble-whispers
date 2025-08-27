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
  const activeClasses = "text-lo-teal";
  const inactiveClasses = "text-gray-400 hover:text-gray-600";
  const centerClasses = isCenter 
    ? "bg-gradient-to-r from-emerald-500 to-lo-teal text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" 
    : "py-2 px-1 min-h-[44px] min-w-[44px]";

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (isCenter) {
    return (
      <Link 
        to={to}
        onClick={handleClick}
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
      <span className="mt-1 text-[10px]">{label}</span>
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
      icon: <Home className="h-5 w-5" />,
      label: 'Home',
      isActive: isActive('/home')
    },
    {
      to: '/explore',
      icon: <Compass className="h-5 w-5" />,
      label: 'Explore',
      isActive: isActive('/explore')
    },
    {
      to: onPostClick ? '#' : '/home', // Use callback or fallback to home
      icon: <Plus className="h-6 w-6" />,
      label: 'Post',
      isActive: false,
      isCenter: true,
      onClick: onPostClick
    },
    {
      to: '/inbox',
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Inbox',
      isActive: isActive('/inbox')
    },
    {
      to: '/profile',
      icon: <User className="h-5 w-5" />,
      label: 'Profile',
      isActive: isActive('/profile')
    }
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bottom-nav-glass",
      "safe-area-inset-bottom",
      className
    )}>
      <div className="flex items-center justify-around px-6 py-2">
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
      <div className="h-safe-area-inset-bottom bottom-nav-glass" />
    </nav>
  );
};

export default BottomNavigation;
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Search, Camera, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  requiresAuth?: boolean;
}

const tabs: TabItem[] = [
  {
    id: 'map',
    label: 'Map',
    icon: Map,
    path: '/home'
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: Search,
    path: '/list'
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: Camera,
    path: '/camera',
    requiresAuth: true
  },
  {
    id: 'inbox',
    label: 'Inbox',
    icon: MessageCircle,
    path: '/inbox',
    requiresAuth: true
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    requiresAuth: true
  }
];

const TabNavigator: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show tab bar on certain pages
  const hiddenRoutes = ['/', '/auth', '/profile-setup', '/download'];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2 pb-safe-area-bottom">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          // Skip auth-required tabs if user is not logged in
          if (tab.requiresAuth && !user) {
            return null;
          }

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 min-w-[44px] min-h-[44px] rounded-lg transition-colors duration-200",
                isActive 
                  ? "text-blue-600" 
                  : "text-gray-600 active:bg-gray-100"
              )}
            >
              <Icon 
                size={24} 
                className={cn(
                  "mb-1 transition-colors duration-200",
                  isActive ? "text-blue-600" : "text-gray-600"
                )} 
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  isActive ? "text-blue-600" : "text-gray-600"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigator;
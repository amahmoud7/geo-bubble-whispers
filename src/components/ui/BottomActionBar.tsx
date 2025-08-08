import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User, Map, Calendar } from 'lucide-react';
import { Button } from './button';
import { FloatingActionButton } from './FloatingActionButton';
import { useAuth } from '@/hooks/useAuth';

interface BottomActionBarProps {
  onCreateTextMessage?: () => void;
  onCreatePhotoMessage?: () => void;
  onCreateVideoMessage?: () => void;
  onStartLiveStream?: () => void;
  onLoadEvents?: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onCreateTextMessage,
  onCreatePhotoMessage,
  onCreateVideoMessage,
  onStartLiveStream,
  onLoadEvents
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFAB, setShowFAB] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLoPostClick = () => {
    if (location.pathname === '/home' || location.pathname === '/map') {
      // On map page - show FAB for creation options
      setShowFAB(true);
    } else {
      // Navigate to map and then show FAB
      navigate('/home');
      setTimeout(() => setShowFAB(true), 300);
    }
  };

  const actions = [
    {
      icon: <Home className="w-6 h-6" />,
      label: 'Home',
      path: '/home',
      isActive: isActive('/home') || isActive('/'),
      onClick: () => navigate('/home')
    },
    {
      icon: <Search className="w-6 h-6" />,
      label: 'Explore',
      path: '/explore',
      isActive: isActive('/explore'),
      onClick: () => navigate('/list')
    },
    {
      icon: <Plus className="w-7 h-7" />,
      label: 'Lo Post',
      path: null,
      isActive: false,
      isSpecial: true,
      onClick: handleLoPostClick
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      label: 'Inbox',
      path: '/inbox',
      isActive: isActive('/inbox'),
      onClick: () => user ? navigate('/inbox') : navigate('/auth')
    },
    {
      icon: <User className="w-6 h-6" />,
      label: 'Profile',
      path: '/profile',
      isActive: isActive('/profile'),
      onClick: () => user ? navigate('/profile') : navigate('/auth')
    }
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around h-20 px-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center h-16 px-3 rounded-xl transition-all duration-200 ${
                action.isSpecial 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : action.isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className={`mb-1 transition-transform duration-200 ${action.isActive ? 'transform scale-110' : ''}`}>
                {action.icon}
              </div>
              <span className={`text-xs font-medium ${action.isSpecial ? 'text-white' : ''}`}>
                {action.label}
              </span>
              {action.isActive && !action.isSpecial && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Floating Action Button - shows when Lo Post is clicked */}
      {showFAB && (
        <FloatingActionButton
          onCreateTextMessage={() => {
            onCreateTextMessage?.();
            setShowFAB(false);
          }}
          onCreatePhotoMessage={() => {
            onCreatePhotoMessage?.();
            setShowFAB(false);
          }}
          onCreateVideoMessage={() => {
            onCreateVideoMessage?.();
            setShowFAB(false);
          }}
          onStartLiveStream={() => {
            onStartLiveStream?.();
            setShowFAB(false);
          }}
          onLoadEvents={() => {
            onLoadEvents?.();
            setShowFAB(false);
          }}
          className="bottom-24"
        />
      )}

      {/* Backdrop to close FAB */}
      {showFAB && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowFAB(false)}
        />
      )}
    </>
  );
};
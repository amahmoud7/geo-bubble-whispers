import React, { useState } from 'react';
import { Button } from './button';
import { Plus, MessageSquare, Camera, Video, VideoIcon, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  onCreateTextMessage: () => void;
  onCreatePhotoMessage: () => void;
  onCreateVideoMessage: () => void;
  onStartLiveStream: () => void;
  onLoadEvents: () => void;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onCreateTextMessage,
  onCreatePhotoMessage,
  onCreateVideoMessage,
  onStartLiveStream,
  onLoadEvents,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions: FABAction[] = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Text Lo',
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => {
        onCreateTextMessage();
        setIsExpanded(false);
      }
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: 'Photo Lo',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => {
        onCreatePhotoMessage();
        setIsExpanded(false);
      }
    },
    {
      icon: <Video className="w-5 h-5" />,
      label: 'Video Lo',
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => {
        onCreateVideoMessage();
        setIsExpanded(false);
      }
    },
    {
      icon: <VideoIcon className="w-5 h-5" />,
      label: 'Live Stream',
      color: 'bg-red-600 hover:bg-red-700',
      onClick: () => {
        onStartLiveStream();
        setIsExpanded(false);
      }
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Events',
      color: 'bg-amber-600 hover:bg-amber-700',
      onClick: () => {
        onLoadEvents();
        setIsExpanded(false);
      }
    }
  ];

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Action buttons - appear when expanded */}
      <div
        className={cn(
          "flex flex-col items-end space-y-3 mb-4 transition-all duration-300 ease-out",
          isExpanded 
            ? "opacity-100 transform translate-y-0 pointer-events-auto" 
            : "opacity-0 transform translate-y-4 pointer-events-none"
        )}
      >
        {actions.map((action, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Label */}
            <div
              className={cn(
                "bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all duration-200",
                isExpanded ? "opacity-100 transform translate-x-0" : "opacity-0 transform translate-x-2"
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {action.label}
            </div>
            {/* Action button */}
            <Button
              onClick={action.onClick}
              className={cn(
                "w-12 h-12 rounded-full shadow-lg transition-all duration-200 transform",
                action.color,
                isExpanded 
                  ? "scale-100 opacity-100" 
                  : "scale-0 opacity-0"
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {action.icon}
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl transition-all duration-300 transform",
          isExpanded ? "rotate-45 bg-gray-600 hover:bg-gray-700" : "rotate-0"
        )}
      >
        <Plus className={cn(
          "w-6 h-6 transition-transform duration-300",
          isExpanded ? "rotate-45" : "rotate-0"
        )} />
      </Button>

      {/* Backdrop - close when tapped */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};
import React from 'react';

interface EventMarkerIconProps {
  isStartingSoon?: boolean;
  onClick?: () => void;
}

const EventMarkerIcon: React.FC<EventMarkerIconProps> = ({
  isStartingSoon = false,
  onClick
}) => {
  return (
    <div 
      className={`
        relative cursor-pointer transform hover:scale-110 transition-all duration-200
        ${isStartingSoon ? 'animate-bounce' : ''}
      `}
      onClick={onClick}
    >
      {/* Outer glow effect */}
      <div className={`
        absolute inset-0 rounded-full blur-sm
        ${isStartingSoon 
          ? 'bg-red-400 animate-pulse' 
          : 'bg-amber-400'
        }
        w-8 h-8 -top-1 -left-1
      `} />
      
      {/* Main marker */}
      <div className={`
        relative w-6 h-6 rounded-full border-2 border-white shadow-lg
        flex items-center justify-center text-white text-xs font-bold
        ${isStartingSoon 
          ? 'bg-gradient-to-br from-red-500 to-red-600' 
          : 'bg-gradient-to-br from-amber-500 to-yellow-600'
        }
      `}>
        🎫
      </div>
      
      {/* Marker tail */}
      <div className={`
        absolute left-1/2 transform -translate-x-1/2 top-5
        w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent
        ${isStartingSoon 
          ? 'border-t-red-600' 
          : 'border-t-yellow-600'
        }
      `} />

      {/* Pulse effect for events starting soon */}
      {isStartingSoon && (
        <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping w-6 h-6" />
      )}
    </div>
  );
};

export default EventMarkerIcon;
import React from 'react';
import { Calendar, Music, Theater, Trophy, Gamepad2, Palette, Star } from 'lucide-react';

interface EventMarkerIconProps {
  isStartingSoon?: boolean;
  eventCategory?: string;
  eventSource?: string;
  priceRange?: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

const EventMarkerIcon: React.FC<EventMarkerIconProps> = ({
  isStartingSoon = false,
  eventCategory = 'general',
  eventSource = 'ticketmaster',
  priceRange = 'medium',
  onClick
}) => {
  // Get category-specific icon and colors
  const getCategoryIcon = (category: string) => {
    const categoryMap: Record<string, { icon: JSX.Element; colors: string }> = {
      music: { 
        icon: <Music className="w-3 h-3" />, 
        colors: 'from-purple-500 to-pink-600' 
      },
      sports: { 
        icon: <Trophy className="w-3 h-3" />, 
        colors: 'from-green-500 to-emerald-600' 
      },
      theater: { 
        icon: <Theater className="w-3 h-3" />, 
        colors: 'from-red-500 to-rose-600' 
      },
      arts: { 
        icon: <Palette className="w-3 h-3" />, 
        colors: 'from-indigo-500 to-purple-600' 
      },
      family: { 
        icon: <Star className="w-3 h-3" />, 
        colors: 'from-orange-500 to-amber-600' 
      },
      gaming: { 
        icon: <Gamepad2 className="w-3 h-3" />, 
        colors: 'from-blue-500 to-cyan-600' 
      },
      general: { 
        icon: <Calendar className="w-3 h-3" />, 
        colors: 'from-amber-500 to-yellow-600' 
      }
    };

    return categoryMap[category.toLowerCase()] || categoryMap.general;
  };

  const categoryInfo = getCategoryIcon(eventCategory);

  // Get price indicator colors
  const getPriceColors = () => {
    switch (priceRange) {
      case 'low': return 'bg-green-100 border-green-400 text-green-700';
      case 'high': return 'bg-red-100 border-red-400 text-red-700';
      default: return 'bg-yellow-100 border-yellow-400 text-yellow-700';
    }
  };

  // Enhanced styling for starting soon events
  const urgencyStyles = isStartingSoon 
    ? {
        outerGlow: 'bg-red-400 animate-pulse shadow-lg shadow-red-400/50',
        markerBg: 'bg-gradient-to-br from-red-500 to-red-700',
        tailColor: 'border-t-red-700',
        pulseRing: 'border-red-400 animate-ping'
      }
    : {
        outerGlow: 'bg-amber-400/60 shadow-md shadow-amber-400/30',
        markerBg: `bg-gradient-to-br ${categoryInfo.colors}`,
        tailColor: 'border-t-amber-600',
        pulseRing: 'border-amber-400'
      };

  return (
    <div 
      className={`
        group relative cursor-pointer transition-all duration-300 ease-out
        hover:scale-110 active:scale-95 touch-manipulation
        ${isStartingSoon ? 'animate-bounce' : ''}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${eventCategory} event ${isStartingSoon ? '(starting soon)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Outer glow effect with enhanced shadow */}
      <div 
        className={`
          absolute inset-0 rounded-full blur-sm transition-all duration-300
          ${urgencyStyles.outerGlow}
          w-10 h-10 -top-2 -left-2 group-hover:w-12 group-hover:h-12 group-hover:-top-3 group-hover:-left-3
        `} 
      />
      
      {/* Main marker with improved sizing */}
      <div className={`
        relative w-8 h-8 rounded-full border-3 border-white shadow-xl
        flex items-center justify-center text-white transition-all duration-200
        ${urgencyStyles.markerBg}
        group-hover:shadow-2xl
      `}>
        {categoryInfo.icon}
        
        {/* Category indicator dot */}
        <div 
          className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
            ${urgencyStyles.markerBg}
          `}
        >
          <div className="w-full h-full rounded-full bg-white/30" />
        </div>
      </div>
      
      {/* Enhanced marker tail with shadow */}
      <div className={`
        absolute left-1/2 transform -translate-x-1/2 top-6
        w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-transparent
        ${urgencyStyles.tailColor}
        drop-shadow-sm
      `} />

      {/* Source indicator badge */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className={`
          text-xs px-2 py-0.5 rounded-full border font-medium
          ${eventSource === 'ticketmaster' 
            ? 'bg-blue-100 border-blue-400 text-blue-700' 
            : 'bg-green-100 border-green-400 text-green-700'
          }
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
        `}>
          {eventSource === 'ticketmaster' ? 'TM' : 'EB'}
        </div>
      </div>

      {/* Price indicator */}
      <div className="absolute -top-3 -left-3">
        <div className={`
          w-4 h-4 rounded-full border-2 text-xs flex items-center justify-center font-bold
          ${getPriceColors()}
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
        `}>
          {priceRange === 'low' ? '$' : priceRange === 'high' ? '$$$' : '$$'}
        </div>
      </div>

      {/* Enhanced pulse effect for events starting soon */}
      {isStartingSoon && (
        <>
          <div className={`absolute inset-0 rounded-full border-2 ${urgencyStyles.pulseRing} w-8 h-8 opacity-75`} />
          <div className={`absolute inset-0 rounded-full border-2 ${urgencyStyles.pulseRing} w-8 h-8 animation-delay-75`} />
        </>
      )}

      {/* Accessibility enhancement - screen reader friendly */}
      <div className="sr-only">
        {eventCategory} event marker. Click to view details.
        {isStartingSoon && ' This event is starting soon!'}
      </div>
    </div>
  );
};

export default EventMarkerIcon;
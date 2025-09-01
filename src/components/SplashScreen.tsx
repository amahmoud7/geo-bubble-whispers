import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 2500 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    const animateTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 100);

    // Hide splash screen after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(animateTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-lo-navy via-lo-dark-blue to-lo-near-black flex items-center justify-center overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0">
        {/* Gradient orbs for depth */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-lo-teal/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-lo-blue-gray/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>
      </div>

      {/* Logo Container */}
      <div className={`relative flex items-center justify-center transition-all duration-1000 ${
        isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-lo-teal/20 rounded-full filter blur-2xl animate-pulse"></div>
        </div>

        {/* Main Logo */}
        <div className="relative flex items-baseline">
          {/* "L" Letter */}
          <div className={`transition-all duration-700 delay-300 ${
            isAnimating ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}>
            <span className="text-8xl md:text-9xl font-bold text-lo-white tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textShadow: '0 4px 20px rgba(19, 211, 170, 0.3)'
                  }}>
              L
            </span>
          </div>

          {/* "o" Letter with integrated pin */}
          <div className={`relative transition-all duration-700 delay-500 ${
            isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <span className="text-8xl md:text-9xl font-bold text-lo-white tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textShadow: '0 4px 20px rgba(19, 211, 170, 0.3)'
                  }}>
              o
            </span>
            
            {/* Location Pin replacing the "o" */}
            <div className={`absolute -top-2 -right-8 transition-all duration-700 delay-700 ${
              isAnimating ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-180 opacity-0'
            }`}>
              <div className="relative">
                {/* Pin Shadow */}
                <div className="absolute inset-0 bg-lo-teal/30 rounded-full filter blur-xl"></div>
                
                {/* Pin Icon */}
                <div className="relative bg-gradient-to-br from-lo-teal to-emerald-400 p-3 rounded-t-full rounded-b-full transform rotate-45 shadow-2xl">
                  <div className="bg-lo-navy w-4 h-4 rounded-full transform -rotate-45"></div>
                </div>
                
                {/* Pin Point */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 
                              border-l-[12px] border-l-transparent
                              border-r-[12px] border-r-transparent
                              border-t-[16px] border-t-lo-teal"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className={`absolute -bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-700 delay-1000 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <p className="text-lo-teal/80 text-sm md:text-base font-medium tracking-widest uppercase whitespace-nowrap">
            Share Your Location Story
          </p>
        </div>
      </div>

      {/* Loading indicator */}
      <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-all duration-500 delay-1200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-lo-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-lo-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-lo-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* Ripple effect on load */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 border-2 border-lo-teal/30 rounded-full animate-ping"></div>
          <div className="absolute w-48 h-48 border-2 border-lo-teal/20 rounded-full animate-ping animation-delay-200"></div>
          <div className="absolute w-64 h-64 border-2 border-lo-teal/10 rounded-full animate-ping animation-delay-400"></div>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
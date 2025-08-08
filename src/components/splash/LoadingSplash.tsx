import React, { useEffect, useState } from 'react';

interface LoadingSplashProps {
  onComplete: () => void;
}

const LoadingSplash: React.FC<LoadingSplashProps> = ({ onComplete }) => {
  const [logoScale, setLogoScale] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(0);

  useEffect(() => {
    // Logo entrance animation
    const timer1 = setTimeout(() => {
      setLogoOpacity(1);
      setLogoScale(1);
    }, 300);

    // Auto complete after 2.5 seconds
    const timer2 = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-100 via-teal-500 to-teal-600 flex items-center justify-center">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-800/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-slate-700/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Lo Logo */}
      <div 
        className="relative z-10 transition-all duration-700 ease-out"
        style={{ 
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        <img 
          src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
          alt="Lo" 
          className="w-32 h-32 drop-shadow-2xl"
        />
        
        {/* Subtle pulsing ring around logo */}
        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '2s' }}></div>
      </div>

      {/* Optional loading indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-slate-700/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-slate-700/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-slate-700/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSplash;
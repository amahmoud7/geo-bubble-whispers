import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, Users, Sparkles, ArrowRight, Globe, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { mobileOAuthService } from '@/services/mobileOAuth';

const WelcomeScreen: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const { signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <MapPin className="w-12 h-12" />,
      title: "Drop Your Lo",
      subtitle: "Anywhere, Everywhere",
      description: "Share moments at exact locations. Your thoughts become part of the world's story."
    },
    {
      icon: <MessageCircle className="w-12 h-12" />,
      title: "Discover Stories",
      subtitle: "Right Where They Happened",
      description: "Find authentic messages from real people at the places that matter."
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Connect Locally",
      subtitle: "Your Neighborhood Awaits",
      description: "Meet people, join events, and be part of your local community."
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleSignIn = async () => {
    // Check if we're on mobile (Capacitor)
    const isMobile = window.location.protocol === 'capacitor:' || 
                     window.location.protocol === 'ionic:' ||
                     (window as any).Capacitor;
    
    if (isMobile) {
      // Use isolated mobile OAuth service
      setIsAuthenticating(true);
      setAuthError('');
      
      try {
        console.log('Using isolated mobile OAuth for Google...');
        const result = await mobileOAuthService.signInWithGoogle();
        
        if (result.success) {
          console.log('Mobile OAuth successful, navigating to home...');
          navigate('/home');
        } else {
          console.error('Mobile OAuth failed:', result.error);
          setAuthError(result.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('Google sign in error:', error);
        setAuthError('Authentication failed. Please try again.');
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      // Use standard OAuth for web
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Google sign in error:', error);
      }
    }
  };

  const handleAppleSignIn = async () => {
    // Check if we're on mobile (Capacitor)
    const isMobile = window.location.protocol === 'capacitor:' || 
                     window.location.protocol === 'ionic:' ||
                     (window as any).Capacitor;
    
    if (isMobile) {
      // Use isolated mobile OAuth service
      setIsAuthenticating(true);
      setAuthError('');
      
      try {
        const result = await mobileOAuthService.signInWithApple();
        
        if (result.success) {
          navigate('/home');
        } else {
          setAuthError(result.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('Apple sign in error:', error);
        setAuthError('Authentication failed. Please try again.');
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      // Use standard OAuth for web
      try {
        await signInWithApple();
      } catch (error) {
        console.error('Apple sign in error:', error);
      }
    }
  };

  const handleEmailSignIn = () => {
    navigate('/email-auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-500 to-teal-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-800/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-slate-700/20 rounded-full blur-2xl animate-ping" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-teal-300/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <MapPin className="absolute top-20 left-10 w-6 h-6 text-slate-700/50 animate-float" style={{ animationDelay: '0s' }} />
        <MessageCircle className="absolute top-32 right-16 w-8 h-8 text-white/60 animate-float" style={{ animationDelay: '1s' }} />
        <Globe className="absolute bottom-40 left-20 w-7 h-7 text-slate-800/40 animate-float" style={{ animationDelay: '2s' }} />
        <Zap className="absolute top-40 left-1/2 w-5 h-5 text-teal-300/70 animate-float" style={{ animationDelay: '1.5s' }} />
        <Users className="absolute bottom-32 right-12 w-6 h-6 text-white/50 animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className={`relative z-10 min-h-screen flex flex-col transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header */}
        <div className="text-center pt-16 pb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
              alt="Lo Logo" 
              className="h-24 drop-shadow-2xl"
            />
            <Sparkles className="w-8 h-8 text-teal-200 ml-3 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-3 tracking-tight drop-shadow-sm">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-700">Lo</span>
          </h1>
          <p className="text-slate-700 text-xl font-semibold drop-shadow-sm">
            Where Every Location Tells a Story
          </p>
        </div>

        {/* Feature Showcase - Simplified */}
        <div className="flex-1 flex items-center justify-center px-6 py-4">
          <div className="max-w-xs text-center">
            <div className="relative h-48 flex items-center justify-center mb-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ${
                    index === currentFeature 
                      ? 'opacity-100 transform translate-y-0 scale-100' 
                      : 'opacity-0 transform translate-y-4 scale-95'
                  }`}
                >
                  <div className="text-center px-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800/80 backdrop-blur-md rounded-full mb-4 text-teal-200 shadow-2xl border-2 border-white/20">
                      {feature.icon}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1 drop-shadow-sm">{feature.title}</h2>
                    <h3 className="text-base text-slate-700 font-semibold mb-2">{feature.subtitle}</h3>
                    <p className="text-slate-700 leading-snug text-sm font-medium px-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Indicators */}
            <div className="flex justify-center space-x-2 mb-4">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentFeature 
                      ? 'w-6 bg-slate-800 shadow-lg' 
                      : 'w-1.5 bg-slate-700/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="px-6 pb-16 mt-auto">
          <div className="max-w-sm mx-auto space-y-4">
            {/* Error Message */}
            {authError && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-xl text-sm font-medium text-center">
                {authError}
              </div>
            )}
            
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full h-14 bg-white/95 text-slate-800 hover:bg-white font-bold text-base rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center space-x-3">
                {isAuthenticating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{isAuthenticating ? 'Signing in...' : 'Continue with Google'}</span>
              </div>
            </Button>

            {/* Apple Sign In */}
            <Button
              onClick={handleAppleSignIn}
              className="w-full h-14 bg-slate-800 text-white hover:bg-slate-900 font-bold text-base rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-slate-700"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 4.616c1.34-1.576 3.188-2.616 4.98-2.616 0.203 1.617-0.596 3.262-1.435 4.38-0.839 1.147-2.166 2.044-3.546 2.044-0.213-1.647 0.584-3.262 2.001-3.808zM20.5 18.5c-0.804 1.835-1.188 2.655-2.214 4.271-1.026 1.647-2.47 3.699-4.252 3.729-1.663 0.03-2.134-1.026-4.42-1.026-2.256 0-2.786 0.996-4.419 1.056-1.693 0.061-3.317-2.134-4.343-3.781-2.134-3.414-3.79-9.722-1.587-13.969 1.547-2.988 4.313-4.88 7.301-4.91 1.922-0.030 3.729 1.309 4.9 1.309 1.171 0 3.378-1.614 5.697-1.378 0.97 0.041 3.699 0.393 5.453 2.957-0.142 0.089-3.257 1.9-3.227 5.67 0.030 4.496 3.946 6.013 4.011 6.043-0.030 0.089-0.626 2.164-2.063 4.302z"/>
                </svg>
                <span>Continue with Apple</span>
              </div>
            </Button>

            {/* Email Sign In */}
            <Button
              onClick={handleEmailSignIn}
              className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-teal-500"
            >
              <div className="flex items-center justify-center space-x-3">
                <MessageCircle className="w-6 h-6" />
                <span>Sign in with Email</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </Button>

            <p className="text-center text-slate-700 text-sm font-medium mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(2deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
};

export default WelcomeScreen;
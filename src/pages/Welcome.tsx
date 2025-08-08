import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';

const Welcome: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
            alt="Lo Logo" 
            className="h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show welcome screen
  if (!user) {
    return <WelcomeScreen />;
  }

  return null;
};

export default Welcome;
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const OAuthHandler: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          navigate('/');
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          console.log('OAuth success, redirecting to home');
          navigate('/home');
        } else {
          // No session, redirect to welcome
          console.log('No session found, redirecting to welcome');
          navigate('/');
        }
      } catch (error) {
        console.error('OAuth handling error:', error);
        navigate('/');
      }
    };

    // Handle the callback
    handleOAuthCallback();
  }, [navigate]);

  // Also listen for user changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated via OAuth, redirecting to home');
      navigate('/home');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-500 to-teal-600 flex items-center justify-center">
      <div className="text-center">
        <img 
          src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
          alt="Lo Logo" 
          className="h-16 mx-auto mb-4 animate-pulse"
        />
        <p className="text-slate-800 text-lg font-semibold">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuthHandler;
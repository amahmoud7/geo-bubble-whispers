import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          // Send error to parent
          window.parent.postMessage({
            type: 'OAUTH_ERROR',
            error: error.message
          }, window.location.origin);
          return;
        }

        if (data.session) {
          console.log('Auth callback success');
          // Send success to parent
          window.parent.postMessage({
            type: 'OAUTH_SUCCESS',
            session: data.session
          }, window.location.origin);
        } else {
          // Try to get session from URL hash
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });

            if (sessionError) {
              throw sessionError;
            }

            console.log('Auth callback success via hash');
            window.parent.postMessage({
              type: 'OAUTH_SUCCESS',
              session: sessionData.session
            }, window.location.origin);
          } else {
            throw new Error('No session or tokens found');
          }
        }
      } catch (error) {
        console.error('Auth callback processing error:', error);
        window.parent.postMessage({
          type: 'OAUTH_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, window.location.origin);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-500 to-teal-600 flex items-center justify-center">
      <div className="text-center">
        <img 
          src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
          alt="Lo Logo" 
          className="h-16 mx-auto mb-4 animate-pulse"
        />
        <p className="text-slate-800 text-lg font-semibold">Completing authentication...</p>
        <p className="text-slate-700 text-sm mt-2">Please wait while we sign you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmbeddedOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'google' | 'apple';
}

export const EmbeddedOAuthModal: React.FC<EmbeddedOAuthModalProps> = ({
  isOpen,
  onClose,
  provider
}) => {
  const [oauthUrl, setOauthUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      initOAuth();
    }
  }, [isOpen, provider]);

  useEffect(() => {
    if (user) {
      onClose();
      navigate('/home');
    }
  }, [user, onClose, navigate]);

  const initOAuth = async () => {
    try {
      setLoading(true);
      setError('');

      // Clear any existing sessions first
      console.log('Clearing existing sessions...');
      await supabase.auth.signOut();

      // Add a small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get OAuth URL from Supabase with mobile-specific parameters
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Force account selection
            include_granted_scopes: 'true',
            state: `mobile_app_${Date.now()}`, // Unique state for mobile
          },
          scopes: 'openid email profile'
        }
      });

      if (error) throw error;

      if (data.url) {
        // Add additional parameters to ensure fresh authentication
        const url = new URL(data.url);
        url.searchParams.set('prompt', 'select_account');
        url.searchParams.set('max_age', '0'); // Force fresh authentication
        
        setOauthUrl(url.toString());
        setLoading(false);
      }

    } catch (err) {
      console.error('OAuth initialization error:', err);
      setError('Failed to initialize OAuth');
      setLoading(false);
    }
  };

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only process messages from our OAuth iframe
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OAUTH_SUCCESS') {
        console.log('OAuth success detected');
        onClose();
        navigate('/home');
      } else if (event.data.type === 'OAUTH_ERROR') {
        console.error('OAuth error:', event.data.error);
        setError('Authentication failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            Sign in with {provider === 'google' ? 'Google' : 'Apple'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-slate-600">Loading authentication...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-slate-800 font-medium mb-2">Authentication Error</p>
                <p className="text-slate-600 text-sm mb-4">{error}</p>
                <Button
                  onClick={initOAuth}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {oauthUrl && !loading && !error && (
            <iframe
              ref={iframeRef}
              src={oauthUrl}
              className="w-full h-full border-0 rounded-b-2xl"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title={`${provider} OAuth`}
            />
          )}
        </div>
      </div>
    </div>
  );
};
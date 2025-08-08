import { supabase } from '@/integrations/supabase/client';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { clearAllSessions } from '@/utils/clearWebAppSessions';

class MobileOAuthService {
  private authInProgress = false;

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (this.authInProgress) {
      return { success: false, error: 'Authentication already in progress' };
    }

    try {
      this.authInProgress = true;
      console.log('Starting isolated mobile OAuth flow...');

      // STEP 1: Clear any existing sessions completely
      await clearAllSessions();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup

      // STEP 2: Create completely isolated OAuth URL with mobile-specific parameters
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use mobile app redirect URL - completely different from web app
          redirectTo: `com.geobubblewhispers.app://auth/callback`,
          queryParams: {
            // Force fresh authentication - no cached sessions
            prompt: 'consent select_account',
            access_type: 'offline',
            include_granted_scopes: 'false', // Don't include existing scopes
            max_age: '0', // Force fresh login
            // Mobile-specific state parameter
            state: `mobile_oauth_${Date.now()}_${Math.random().toString(36)}`,
            // Different client context
            hd: '', // Clear any domain hints
            login_hint: '', // Clear any login hints
          },
          // Mobile-specific scopes
          scopes: 'openid email profile'
        }
      });

      if (error) {
        console.error('OAuth URL generation error:', error);
        return { success: false, error: error.message };
      }

      if (!data.url) {
        return { success: false, error: 'No OAuth URL generated' };
      }

      // STEP 3: Open OAuth in mobile browser with isolated parameters
      const oauthUrl = new URL(data.url);
      
      // Additional isolation parameters
      oauthUrl.searchParams.set('prompt', 'consent select_account');
      oauthUrl.searchParams.set('approval_prompt', 'force');
      oauthUrl.searchParams.set('max_age', '0');
      
      console.log('Opening isolated OAuth URL:', oauthUrl.toString());

      await Browser.open({
        url: oauthUrl.toString(),
        windowName: '_self',
        toolbarColor: '#0ea5e9',
        presentationStyle: 'popover'
      });

      // STEP 4: Listen for the custom URL scheme callback
      return new Promise((resolve) => {
        const handleAppUrlOpen = async (data: any) => {
          console.log('App URL opened:', data.url);
          
          if (data.url?.startsWith('com.geobubblewhispers.app://auth/callback')) {
            try {
              // Close the browser
              await Browser.close();
              
              // Parse the OAuth response
              const url = new URL(data.url);
              const fragment = url.hash.substring(1);
              const params = new URLSearchParams(fragment);
              
              const access_token = params.get('access_token');
              const refresh_token = params.get('refresh_token');
              
              if (access_token) {
                // Set the session in Supabase
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                  access_token,
                  refresh_token: refresh_token || ''
                });
                
                if (sessionError) {
                  console.error('Session error:', sessionError);
                  resolve({ success: false, error: sessionError.message });
                } else {
                  console.log('Mobile OAuth successful');
                  resolve({ success: true });
                }
              } else {
                const error = params.get('error_description') || 'Authentication failed';
                console.error('OAuth error:', error);
                resolve({ success: false, error });
              }
              
              // Remove the listener
              App.removeAllListeners();
            } catch (err) {
              console.error('Error handling OAuth callback:', err);
              resolve({ success: false, error: 'Failed to process authentication' });
            }
          }
        };

        // Listen for app URL opens (our custom scheme)
        App.addListener('appUrlOpen', handleAppUrlOpen);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          App.removeAllListeners();
          resolve({ success: false, error: 'Authentication timeout' });
        }, 300000);
      });

    } catch (error) {
      console.error('Mobile OAuth error:', error);
      return { success: false, error: 'Authentication failed' };
    } finally {
      this.authInProgress = false;
    }
  }

  async signInWithApple(): Promise<{ success: boolean; error?: string }> {
    // Similar implementation for Apple - placeholder for now
    return { success: false, error: 'Apple Sign-In not yet implemented for mobile' };
  }
}

export const mobileOAuthService = new MobileOAuthService();
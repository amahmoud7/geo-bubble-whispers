import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

class NativeAuthService {
  private authListener: any = null;

  async initializeOAuthListener() {
    // Clean up existing listener
    if (this.authListener) {
      this.authListener.remove();
    }

    // Listen for app URL opens (OAuth callbacks)
    this.authListener = await App.addListener('appUrlOpen', async (event) => {
      console.log('OAuth callback received:', event.url);
      
      if (event.url.includes('auth')) {
        // Close the browser
        await Browser.close();
        
        // Handle the OAuth callback
        await this.handleOAuthCallback(event.url);
      }
    });
  }

  async signInWithGoogle() {
    try {
      // Initialize the listener first
      await this.initializeOAuthListener();

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.geobubblewhispers.app://auth',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;

      if (data.url) {
        // Open OAuth URL in in-app browser
        await Browser.open({
          url: data.url,
          windowName: '_self',
          toolbarColor: '#6366f1',
          presentationStyle: 'popover',
          showTitle: true,
          presentAfterPageLoad: true
        });
      }

    } catch (error) {
      console.error('OAuth error:', error);
      throw error;
    }
  }

  async signInWithApple() {
    try {
      // Initialize the listener first
      await this.initializeOAuthListener();

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'com.geobubblewhispers.app://auth'
        }
      });

      if (error) throw error;

      if (data.url) {
        // Open OAuth URL in in-app browser
        await Browser.open({
          url: data.url,
          windowName: '_self',
          toolbarColor: '#1f2937',
          presentationStyle: 'popover',
          showTitle: true,
          presentAfterPageLoad: true
        });
      }

    } catch (error) {
      console.error('OAuth error:', error);
      throw error;
    }
  }

  private async handleOAuthCallback(url: string) {
    try {
      console.log('Processing OAuth callback:', url);
      
      // Parse the URL to extract tokens
      const urlObj = new URL(url);
      const hashParams = new URLSearchParams(urlObj.hash.slice(1));
      const searchParams = new URLSearchParams(urlObj.search);
      
      // Get tokens from either hash or search params
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const tokenType = hashParams.get('token_type') || searchParams.get('token_type') || 'Bearer';

      if (accessToken) {
        // Set the session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          console.error('Error setting session:', error);
          throw error;
        }

        console.log('OAuth success! User:', data.user);
        
        // Navigate to home page
        if (typeof window !== 'undefined') {
          window.location.href = '/home';
        }
        
        return data;
      } else {
        throw new Error('No access token received from OAuth callback');
      }
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      // Navigate back to welcome on error
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw error;
    }
  }

  cleanup() {
    if (this.authListener) {
      this.authListener.remove();
      this.authListener = null;
    }
  }
}

export const nativeAuthService = new NativeAuthService();
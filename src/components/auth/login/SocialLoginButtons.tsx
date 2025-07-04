
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SocialLoginButtonsProps {
  loading: boolean;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ loading }) => {
  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      console.log('Attempting Google sign in...');
      await signInWithGoogle();
      console.log('Google sign in initiated successfully');
      // Auth state change will handle navigation
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Google authentication failed",
        description: error.message || "Unable to sign in with Google. Please check if Google OAuth is configured in Supabase.",
        variant: "destructive"
      });
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      // Auth state change will handle navigation
    } catch (error: any) {
      console.error('Apple login error:', error);
      toast({
        title: "Apple authentication failed",
        description: error.message || "Unable to sign in with Apple",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg 
            className="mr-2 h-4 w-4" 
            aria-hidden="true" 
            focusable="false" 
            data-prefix="fab" 
            data-icon="google" 
            role="img" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 488 512"
          >
            <path 
              fill="currentColor" 
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleAppleSignIn}
          disabled={loading}
        >
          <svg 
            className="mr-2 h-4 w-4" 
            aria-hidden="true" 
            focusable="false" 
            data-prefix="fab" 
            data-icon="apple" 
            role="img" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 384 512"
          >
            <path 
              fill="currentColor" 
              d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
            ></path>
          </svg>
          Apple
        </Button>
      </div>
    </>
  );
};

export default SocialLoginButtons;

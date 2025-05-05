
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthCard from '@/components/auth/AuthCard';
import { toast } from '@/hooks/use-toast';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isNewUser } = useAuth();
  
  // Check for authentication error in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (error) {
      toast({
        title: "Authentication error",
        description: errorDescription || "There was a problem with authentication",
        variant: "destructive"
      });
    }
  }, [location.search]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      // If it's a new user, redirect to profile setup page
      if (isNewUser) {
        navigate('/profile-setup');
      } else {
        navigate('/home');
      }
    }
  }, [user, loading, isNewUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <AuthCard />
      </div>
    </div>
  );
};

export default Auth;

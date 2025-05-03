
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthCard from '@/components/auth/AuthCard';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <AuthCard />
      </div>
    </div>
  );
};

export default Auth;

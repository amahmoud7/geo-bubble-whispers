
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ProfileUnauthenticated = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container py-6 flex flex-col items-center justify-center flex-grow">
      <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
      <p className="text-muted-foreground mb-4">You need to be signed in to view your profile.</p>
      <Button onClick={() => navigate('/')}>Go to Home</Button>
    </div>
  );
};

export default ProfileUnauthenticated;

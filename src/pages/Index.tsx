
import React from 'react';
import Globe from '../components/Globe';
import AuthForm from '../components/AuthForm';
import { Typography } from '@/components/ui/typography';

const Index = () => {
  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-10 z-10">
        <img 
          src="/lovable-uploads/df79c31c-82e5-46bc-a250-0fb4f46353d2.png" 
          alt="Lo Logo" 
          className="h-16 mb-3"
        />
        <Typography variant="h4" className="text-gray-600">
          Connect with places and people around you
        </Typography>
      </div>
      <Globe />
      <AuthForm />
    </div>
  );
};

export default Index;

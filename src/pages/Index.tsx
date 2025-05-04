
import React from 'react';
import Globe from '../components/Globe';
import AuthForm from '../components/AuthForm';

const Index = () => {
  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-10 z-10">
        <img 
          src="/lovable-uploads/70fd8aa8-14a4-44c2-a2f8-de418d48b1d6.png" 
          alt="Lo Logo" 
          className="h-32 mb-3" // Doubled from h-16 to h-32
        />
      </div>
      <Globe />
      <AuthForm />
    </div>
  );
};

export default Index;

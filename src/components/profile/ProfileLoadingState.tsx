
import React from 'react';
import { Loader2 } from 'lucide-react';

const ProfileLoadingState = () => {
  return (
    <div className="flex items-center justify-center flex-grow">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default ProfileLoadingState;

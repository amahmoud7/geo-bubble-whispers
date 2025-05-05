
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const SubscriptionConfirmed: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Subscription Confirmed!</h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for confirming your subscription. You'll now receive updates about Lo and our latest features.
        </p>
        
        <Button asChild>
          <Link to="/">
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionConfirmed;

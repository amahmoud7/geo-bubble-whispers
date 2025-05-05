
import React from 'react';

interface ResetPasswordConfirmationProps {
  email: string;
}

const ResetPasswordConfirmation: React.FC<ResetPasswordConfirmationProps> = ({ email }) => {
  return (
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-medium">Password Reset Email Sent</h3>
      <p className="text-muted-foreground">
        We've sent instructions to reset your password to <span className="font-medium">{email}</span>.
      </p>
      <p className="text-muted-foreground">
        Please check your inbox and follow the instructions to reset your password.
      </p>
    </div>
  );
};

export default ResetPasswordConfirmation;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import EmailField from './login/EmailField';
import PasswordField from './login/PasswordField';
import SubmitButton from './login/SubmitButton';
import SocialLoginButtons from './login/SocialLoginButtons';
import ResetPasswordConfirmation from './login/ResetPasswordConfirmation';

interface LoginFormProps {
  setEmail: (email: string) => void;
  email: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ setEmail, email }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      await signIn(email, password);
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in",
      });
      
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      await resetPassword(email);
      setPasswordResetSent(true);
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email for instructions to reset your password"
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password reset failed",
        description: error.message || "Unable to send password reset email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (passwordResetSent) {
    return <ResetPasswordConfirmation email={email} />;
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <EmailField email={email} setEmail={setEmail} />
      <PasswordField 
        password={password} 
        setPassword={setPassword} 
        onResetPassword={handlePasswordReset} 
      />
      <SubmitButton loading={loading} />
      <SocialLoginButtons loading={loading} />
    </form>
  );
};

export default LoginForm;

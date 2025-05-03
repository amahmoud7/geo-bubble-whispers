
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AtSign, Key, UserPlus, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface RegisterFormProps {
  setEmail: (email: string) => void;
  email: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ setEmail, email }) => {
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      await signUp(email, password, {
        name: name,
        username: email.split('@')[0],
      });
      
      setEmailSent(true);
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your registration",
      });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create your account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Auth state change will handle navigation
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Google authentication failed",
        description: error.message || "Unable to sign in with Google",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-medium">Verification Email Sent</h3>
        <p className="text-muted-foreground">
          We've sent a confirmation email to <span className="font-medium">{email}</span>.
        </p>
        <p className="text-muted-foreground">
          Please check your inbox and click the verification link to complete your registration.
        </p>
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => setEmailSent(false)}
        >
          Back to Register
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-email"
            type="email"
            placeholder="you@example.com"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          "Creating account..."
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Account
          </>
        )}
      </Button>

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

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <Mail className="mr-2 h-4 w-4" />
        Sign up with Gmail
      </Button>
    </form>
  );
};

export default RegisterForm;

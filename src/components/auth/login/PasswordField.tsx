
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';

interface PasswordFieldProps {
  password: string;
  setPassword: (password: string) => void;
  onResetPassword: (e: React.MouseEvent) => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ 
  password, 
  setPassword, 
  onResetPassword 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">Password</Label>
        <Button 
          variant="link" 
          className="p-0 h-auto text-xs text-primary" 
          onClick={onResetPassword}
          type="button"
        >
          Forgot password?
        </Button>
      </div>
      <div className="relative">
        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          className="pl-10"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default PasswordField;

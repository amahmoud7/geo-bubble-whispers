
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AtSign } from 'lucide-react';

interface EmailFieldProps {
  email: string;
  setEmail: (email: string) => void;
}

const EmailField: React.FC<EmailFieldProps> = ({ email, setEmail }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="pl-10"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default EmailField;


import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PrivacyToggleProps {
  isPublic: boolean;
  onToggle: (checked: boolean) => void;
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({ isPublic, onToggle }) => {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="space-y-0.5">
        <Label htmlFor="public-toggle">Make public</Label>
        <div className="text-xs text-muted-foreground">
          {isPublic ? 'Anyone can see this message' : 'Only followers can see this message'}
        </div>
      </div>
      <Switch
        id="public-toggle"
        checked={isPublic}
        onCheckedChange={onToggle}
      />
    </div>
  );
};

export default PrivacyToggle;

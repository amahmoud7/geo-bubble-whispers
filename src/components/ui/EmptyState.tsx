import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {Icon && (
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-lo-teal/20 to-blue-100 flex items-center justify-center mb-6 shadow-lg">
          <Icon className="h-12 w-12 text-lo-teal" />
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-lo-teal hover:bg-lo-teal/90 shadow-lg shadow-lo-teal/30"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;


import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'large' | 'gradient';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
  variant = 'default',
}) => {
  const titleClasses = {
    default: 'text-lg font-semibold text-slate-900',
    large: 'text-2xl font-bold text-slate-900',
    gradient: 'text-2xl font-bold bg-gradient-to-r from-lo-teal to-blue-600 bg-clip-text text-transparent',
  };

  const subtitleClasses = {
    default: 'text-sm text-slate-500 mt-0.5',
    large: 'text-base text-slate-600 mt-1',
    gradient: 'text-base text-slate-600 mt-1',
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h2 className={titleClasses[variant]}>{title}</h2>
        {subtitle && (
          <p className={subtitleClasses[variant]}>{subtitle}</p>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

export default SectionHeader;




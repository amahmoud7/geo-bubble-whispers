import React from 'react';

export interface PillTabItem {
  key: string;
  label: string;
  count?: number | string;
}

interface PillTabsProps {
  items: PillTabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export const PillTabs: React.FC<PillTabsProps> = ({
  items,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={[
      'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1',
      className,
    ].join(' ')}>
      {items.map((item) => {
        const isActive = item.key === value;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={[
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            ].join(' ')}
          >
            <span>{item.label}</span>
            {typeof item.count !== 'undefined' && (
              <span className={[
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700',
              ].join(' ')}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PillTabs;




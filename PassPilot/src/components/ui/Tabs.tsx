import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}: TabsProps) {
  return (
    <div
      className={cn(
        'flex',
        variant === 'underline' && 'border-b border-surface-200 gap-0',
        variant === 'pills' && 'bg-surface-100 p-1 rounded-xl gap-1',
        variant === 'enclosed' && 'gap-0',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'inline-flex items-center gap-2 font-medium transition-all duration-200 whitespace-nowrap',

            variant === 'underline' && [
              'px-4 py-3 text-sm border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300',
            ],

            variant === 'pills' && [
              'px-4 py-2 text-sm rounded-lg',
              activeTab === tab.id
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700',
            ],

            variant === 'enclosed' && [
              'px-5 py-3 text-sm border rounded-t-xl',
              activeTab === tab.id
                ? 'bg-white border-surface-200 border-b-white text-surface-900 -mb-px'
                : 'bg-surface-50 border-transparent text-surface-500 hover:text-surface-700',
            ],
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-surface-200 text-surface-600',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Convenience wrapper that manages its own state */
export function TabGroup({
  tabs,
  defaultTab,
  children,
  variant,
  className,
}: {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => ReactNode;
  variant?: TabsProps['variant'];
  className?: string;
}) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id || '');

  return (
    <div className={className}>
      <Tabs tabs={tabs} activeTab={active} onChange={setActive} variant={variant} />
      <div className="mt-4">{children(active)}</div>
    </div>
  );
}

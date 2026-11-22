import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'blue' | 'orange' | 'emerald' | 'indigo' | 'amber';
}

const COLOR_STYLES = {
  blue: 'bg-blue-50 text-[#1E40AF] border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900',
  orange:
    'bg-orange-50 text-[#EA580C] border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900',
  emerald:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900',
  indigo:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-900',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'blue',
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
            COLOR_STYLES[accentColor]
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

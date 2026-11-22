import React from 'react';
import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Wrench,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-400">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
      {actionLabel && actionHref && (
        <div className="mt-6">
          <Link href={actionHref}>
            <Button variant="default">{actionLabel}</Button>
          </Link>
        </div>
      )}
      {actionLabel && onAction && !actionHref && (
        <div className="mt-6">
          <Button variant="default" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

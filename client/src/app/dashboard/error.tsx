'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="my-12 mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900/60 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-heading text-xl font-bold text-slate-900 dark:text-white">
        Dashboard View Error
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {error?.message || 'Unable to load dashboard data.'}
      </p>
      <div className="mt-6">
        <Button type="button" variant="default" onClick={() => reset()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry Loading
        </Button>
      </div>
    </div>
  );
}

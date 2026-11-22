'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-lg dark:border-red-900/60 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>

        <h1 className="mt-4 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
          Something Went Wrong
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {error?.message ||
            'An unexpected error occurred while loading this page.'}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="default" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          <Link href="/">
            <Button type="button" variant="subtle">
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

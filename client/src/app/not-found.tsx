import React from 'react';
import Link from 'next/link';
import { Wrench, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center dark:bg-slate-950">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {/* Tools-themed custom illustration */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-400">
          <Wrench className="h-10 w-10 -rotate-12" aria-hidden="true" />
        </div>

        <span className="mt-5 inline-block rounded-full bg-orange-50 px-3 py-1 font-mono text-xs font-bold text-[#EA580C] dark:bg-orange-950/60 dark:text-orange-400">
          ERROR 404 &bull; CIRCUIT DISCONNECTED
        </span>

        <h1 className="mt-3 font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
          Page Not Found
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Even our top technicians couldn&apos;t locate this route. The page or
          service you are looking for may have been moved or is no longer
          available.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="default" className="w-full sm:w-auto">
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="subtle" className="w-full sm:w-auto">
              <Search className="h-4 w-4" aria-hidden="true" />
              Browse Services
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

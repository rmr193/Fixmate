'use client';

import React from 'react';
import Link from 'next/link';
import { XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <XCircle className="h-9 w-9" aria-hidden="true" />
          </div>

          <h1 className="mt-4 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Payment Cancelled
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Your Stripe Checkout session was cancelled. No charges were made,
            and your completed booking remains unpaid so you can try again
            anytime.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard/customer/bookings">
              <Button variant="cta" className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try Again in My Bookings
              </Button>
            </Link>
            <Link href="/dashboard/customer">
              <Button variant="subtle" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Dashboard Overview
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

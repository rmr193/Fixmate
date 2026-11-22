'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AppProviders';
import { apiFetch } from '@/lib/api';
import { PaymentItem } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const { isLoading: authLoading, token } = useAuth();

  const [verifying, setVerifying] = useState(true);
  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!sessionId) {
      setErrorMsg('Missing Stripe checkout session_id in URL.');
      setVerifying(false);
      return;
    }

    let cancelled = false;
    apiFetch<{ payment: PaymentItem; alreadyProcessed: boolean }>(
      `/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`,
      { token }
    )
      .then((res) => {
        if (!cancelled) {
          setPayment(res.data.payment);
          setVerifying(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Could not verify Stripe payment session.'
          );
          setVerifying(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, sessionId, token]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {verifying ? (
          <div className="py-10 space-y-4">
            <Loader2
              className="mx-auto h-12 w-12 animate-spin text-[#1E40AF]"
              aria-hidden="true"
            />
            <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
              Verifying Your Stripe Payment...
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please wait while we confirm your checkout session and update your
              booking status.
            </p>
          </div>
        ) : errorMsg || !payment ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
              Payment Verification Notice
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {errorMsg}
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Link href="/dashboard/customer/bookings">
                <Button variant="default">Back to My Bookings</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </div>

            <div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Stripe Payment Confirmed
              </span>
              <h1 className="mt-3 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
                Payment Successful!
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Your repair booking has been marked as <strong>Paid</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2.5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {payment.serviceTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Technician</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {payment.technicianName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {payment.transactionId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Paid At</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {formatDateTime(payment.paidAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/dashboard/customer/bookings" className="w-full sm:w-auto">
                <Button variant="default" className="w-full">
                  Back to My Bookings
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/dashboard/customer/payments" className="w-full sm:w-auto">
                <Button variant="subtle" className="w-full">
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                  View Payment History
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Suspense fallback={<div className="py-20 text-sm">Verifying payment...</div>}>
          <PaymentSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Wrench,
  UserCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Lock,
  Layers,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-[#EFF6FF] py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-1 text-xs font-bold text-[#1E40AF] dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400">
              <ShieldCheck className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
              Trust, Transparency &amp; Engineering Excellence
            </span>
            <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Reinventing Device &amp; Home Appliance Repair with Zero Upfront Risk
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
              FixMate was built to solve a universal problem: finding a
              trustworthy technician without paying blindly before the repair is
              delivered.
            </p>
          </div>
        </section>

        {/* Mission & Purpose */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              {[
                {
                  title: 'Admin-Verified Listings',
                  description:
                    'Every service created by a technician enters a pending moderation queue. It only appears on public pages once an administrator verifies the scope, pricing, and technician credentials.',
                  icon: UserCheck,
                },
                {
                  title: 'Strict Status Pipeline',
                  description:
                    'Jobs move through an auditable state machine: Requested → Accepted → In Progress → Completed. Customers can cancel freely while a request is still pending acceptance.',
                  icon: Layers,
                },
                {
                  title: 'Pay-After-Service Gate',
                  description:
                    'Stripe Checkout is cryptographically gated on the server. Payment is only unlocked after the assigned technician marks the repair Completed and sets the final amount.',
                  icon: Lock,
                },
              ].map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-2xl border border-slate-200 bg-white p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-400">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h2 className="mt-5 font-heading text-lg font-bold text-slate-900 dark:text-white">
                      {pillar.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Customer vs Technician Benefits */}
        <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Customer Benefits */}
              <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF]/60 p-8 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
                  For Device &amp; Home Owners
                </span>
                <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
                  Customer Benefits
                </h2>
                <ul className="mt-6 space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
                  {[
                    'Browse verified services across 7 specialized electronics and appliance categories.',
                    'Choose between convenient Home Visit or specialized Shop Drop-off servicing.',
                    'Track every status transition in real time from your Customer Dashboard.',
                    'Pay online with Stripe only after the work is completed, and download instant invoices.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#1E40AF] dark:text-blue-400"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/services">
                    <Button variant="default">
                      Browse Repair Services
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Technician Benefits */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                  For Certified Repair Specialists
                </span>
                <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
                  Technician Benefits
                </h2>
                <ul className="mt-6 space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
                  {[
                    'Showcase your technical skills, service area, and starting prices with ImgBB banner uploads.',
                    'Toggle service availability on or off anytime as your workshop schedule fills up.',
                    'Accept or reject incoming repair requests and progress jobs through clear milestones.',
                    'Set the accurate final repair amount upon completion and track verified Stripe payouts.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Wrench
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#EA580C]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/sign-up">
                    <Button variant="cta">
                      Join as a Technician
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

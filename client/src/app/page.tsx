'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShieldCheck,
  Wrench,
  Clock,
  CreditCard,
  CheckCircle2,
  Smartphone,
  Laptop,
  Wind,
  Refrigerator,
  Tv,
  WashingMachine,
  Zap,
  ArrowRight,
  Star,
  BadgeCheck,
  Send,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { apiFetch } from '@/lib/api';
import { ServiceItem } from '@/types';

const CATEGORY_CARDS = [
  {
    name: 'Smartphone',
    description: 'OLED screens, batteries, charging ports & micro-soldering',
    icon: Smartphone,
    color: 'bg-blue-50 text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-400',
  },
  {
    name: 'Laptop & PC',
    description: 'Logic boards, thermal overhaul, NVMe upgrades & PSU fix',
    icon: Laptop,
    color:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400',
  },
  {
    name: 'AC',
    description: 'Hydro-jet servicing, R32/R410A gas refill & inverter PCB',
    icon: Wind,
    color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400',
  },
  {
    name: 'Refrigerator',
    description: 'Compressor diagnostics, thermostat, defrost & door seals',
    icon: Refrigerator,
    color:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    name: 'TV',
    description: '4K LED/QLED backlight arrays, T-Con boards & power supply',
    icon: Tv,
    color:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
  },
  {
    name: 'Washing Machine',
    description: 'Front & top-load drum bearings, drain pumps & error codes',
    icon: WashingMachine,
    color:
      'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    name: 'Electrical',
    description: 'DB breaker boards, surge protection & IPS changeover wiring',
    icon: Zap,
    color:
      'bg-orange-50 text-[#EA580C] dark:bg-orange-950/60 dark:text-orange-400',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Find a Verified Service',
    description:
      'Search and filter approved repair services by category, service mode (Home Visit or Shop Drop-off), and transparent starting price.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Send a Repair Request',
    description:
      'Describe your device issue, pick your preferred date, and submit your request directly to the specialist with zero upfront fee.',
    icon: Send,
  },
  {
    step: '03',
    title: 'Technician Fixes It',
    description:
      'Track real-time status transitions from Requested to Accepted, In Progress, and Completed as your technician restores your device.',
    icon: Wrench,
  },
  {
    step: '04',
    title: 'Pay After Completion',
    description:
      'Only after the technician marks the job Completed and sets the final bill do you pay securely online via Stripe Checkout.',
    icon: CreditCard,
  },
];

const TESTIMONIALS = [
  {
    name: 'Tanvir Ahmed',
    role: 'Product Designer, Mirpur',
    service: 'iPhone 15 Pro OLED Replacement',
    quote:
      'For the first time in Dhaka, I could track every stage of my phone repair online and pay via Stripe only after testing the replaced screen.',
    rating: 5,
  },
  {
    name: 'Sadia Islam',
    role: 'Homeowner, Banani',
    service: 'LG Front-Load Washing Machine Fix',
    quote:
      'Nadia arrived on time, fixed the OE drain pump error cleanly, and the final invoice matched the upfront estimate with complete transparency.',
    rating: 5,
  },
  {
    name: 'Mahmudul Hasan',
    role: 'Software Architect, Gulshan',
    service: 'Inverter Split AC Master Servicing',
    quote:
      'No hidden charges or advance payment risks. FixMate makes hiring an HVAC or electronics engineer as reliable as ordering a ride.',
    rating: 5,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featuredServices = [], isLoading } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: async () => {
      const res = await apiFetch<ServiceItem[]>('/api/services/featured');
      return res.data;
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/services?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/services');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#EFF6FF] py-16 sm:py-20 lg:py-24 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              {/* Left Column: Headline & Search CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#1E40AF] shadow-2xs dark:border-blue-900 dark:bg-slate-900 dark:text-blue-400">
                  <ShieldCheck className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                  Verified Technicians &bull; Pay Only After Job Completion
                </div>

                <h1 className="font-heading text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.12] dark:text-white">
                  Broken Device? Get It Fixed by{' '}
                  <span className="text-[#1E40AF] dark:text-blue-400">
                    Verified Technicians
                  </span>
                </h1>

                <p className="max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg dark:text-slate-300">
                  From smartphone OLED replacements and MacBook logic boards to
                  inverter AC servicing and home electrical diagnostics—book
                  trusted experts with step-by-step job tracking and zero upfront
                  payment risk.
                </p>

                {/* Service Search CTA Box */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-lg sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search repair service (e.g. iPhone screen, AC gas, MacBook, TV)..."
                      aria-label="Search repair services"
                      className="h-11 w-full rounded-xl bg-transparent pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="cta"
                    size="lg"
                    className="shrink-0 rounded-xl px-7"
                  >
                    Find a Technician
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>

                {/* Quick Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Popular:
                  </span>
                  {['Smartphone', 'AC', 'Laptop & PC', 'Refrigerator', 'Washing Machine'].map(
                    (cat) => (
                      <Link
                        key={cat}
                        href={`/services?category=${encodeURIComponent(cat)}`}
                        className="rounded-full border border-blue-200 bg-white/90 px-3 py-1 font-medium text-slate-700 transition-colors hover:border-[#1E40AF] hover:text-[#1E40AF] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500"
                      >
                        {cat}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Engineering & Pipeline Showcase Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl border border-blue-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative h-56 w-full overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80"
                      alt="Certified technician repairing precision electronics"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[11px] font-bold text-white">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Admin Verified Listing
                        </span>
                        <p className="mt-1 text-sm font-bold">
                          Live Repair Pipeline Protection
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold bg-slate-900/80 px-2.5 py-1 rounded-lg">
                        $0 Upfront
                      </span>
                    </div>
                  </div>

                  {/* Pipeline Preview inside Hero */}
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>TRANSPARENT JOB STATUS PIPELINE</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Stripe Protected
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Requested', tone: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
                        { label: 'Accepted', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' },
                        { label: 'In Progress', tone: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
                        { label: 'Completed', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
                      ].map((stage, i) => (
                        <div
                          key={stage.label}
                          className={`rounded-lg border px-2 py-2 text-[11px] font-bold ${stage.tone}`}
                        >
                          <span className="block font-mono text-[10px] opacity-75">
                            Step {i + 1}
                          </span>
                          {stage.label}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-slate-800/70 dark:border-slate-700">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2
                          className="h-5 w-5 text-emerald-600 shrink-0"
                          aria-hidden="true"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Pay Now Unlocks Only at Step 4
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            Verified completion before Stripe Checkout
                          </p>
                        </div>
                      </div>
                      <Link href="/services">
                        <Button variant="default" size="sm">
                          Explore
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. TRUST INDICATORS BAR */}
        <section className="border-b border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                {
                  metric: '100% Verified',
                  label: 'Admin-moderated technician listings',
                  icon: BadgeCheck,
                },
                {
                  metric: 'Pay After Fix',
                  label: 'Stripe Checkout locked until completion',
                  icon: CreditCard,
                },
                {
                  metric: '7 Categories',
                  label: 'Smartphones, Laptops, HVAC & Appliances',
                  icon: Wrench,
                },
                {
                  metric: 'Real-Time Track',
                  label: 'Live status timeline from request to receipt',
                  icon: Clock,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.metric}
                    className="flex items-start gap-3.5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-400">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-heading text-base font-extrabold text-slate-900 dark:text-white">
                        {item.metric}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {item.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. FEATURED REPAIR SERVICES (6 Latest Approved & Available Services) */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
                  Verified Repair Marketplace
                </span>
                <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                  Featured Repair Services
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Latest admin-approved repair services from certified
                  specialists ready for Home Visit or Shop Drop-off.
                </p>
              </div>
              <Link href="/services">
                <Button variant="outline">
                  Browse All Services
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            <div className="mt-10">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <ServiceCardSkeleton key={idx} />
                  ))}
                </div>
              ) : featuredServices.length === 0 ? (
                <EmptyState
                  title="No featured services available yet"
                  description="Check back soon or browse our full service catalog."
                  actionLabel="Browse Services"
                  actionHref="/services"
                />
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredServices.slice(0, 6).map((service) => (
                    <ServiceCard key={service._id} service={service} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. POPULAR CATEGORIES (Clickable cards leading to /services?category=...) */}
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
                Specialized Diagnostics
              </span>
              <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                Popular Repair Categories
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Select a device or appliance category to immediately filter
                available repair specialists in your area.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORY_CARDS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.name}
                    href={`/services?category=${encodeURIComponent(cat.name)}`}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1E40AF] hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                  >
                    <div>
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${cat.color}`}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 font-heading text-base font-bold text-slate-900 group-hover:text-[#1E40AF] dark:text-white dark:group-hover:text-blue-400">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {cat.description}
                      </p>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1E40AF] dark:text-blue-400">
                      Explore {cat.name}
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                );
              })}

              {/* CTA Card */}
              <Link
                href="/services"
                className="flex flex-col justify-between rounded-2xl bg-[#1E40AF] p-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1E3A8A]"
              >
                <div>
                  <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    Full Catalog
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold">
                    Need Another Appliance Fixed?
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-blue-100">
                    View all approved repair listings with instant search,
                    mode filtering, and price sorting.
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white">
                  View All Services
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. HOW FIXMATE WORKS (4-Step Visual Flow) */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                Simple &amp; Transparent Process
              </span>
              <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                How FixMate Works
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Every repair job follows a strict, server-enforced workflow so
                you always know what is happening with your device.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/70 dark:text-blue-400">
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <span className="font-mono text-2xl font-extrabold text-slate-200 dark:text-slate-800">
                          {item.step}
                        </span>
                      </div>
                      <h3 className="mt-5 font-heading text-base font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. WHY CHOOSE FIXMATE & TESTIMONIALS */}
        <section className="border-t border-slate-200 bg-white py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
              <div className="lg:col-span-5 space-y-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
                  Why Choose FixMate
                </span>
                <h2 className="font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                  Built to Eliminate Repair Anxiety &amp; Hidden Costs
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  In traditional repair shops, customers hand over expensive
                  devices without tracking or pricing guarantees. FixMate
                  protects both customers and skilled technicians.
                </p>

                <ul className="space-y-3.5 text-sm">
                  {[
                    'Every service listing is reviewed and approved by an Administrator before appearing publicly.',
                    'Duplicate request protection prevents accidental double-bookings.',
                    'Technicians update status step-by-step and set the final bill only upon completion.',
                    'Secure Stripe Checkout unlocks strictly for completed, unpaid jobs.',
                  ].map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Link href="/services">
                    <Button variant="cta">Book a Repair Now</Button>
                  </Link>
                  <Link href="/about">
                    <Button variant="outline">Learn More About Us</Button>
                  </Link>
                </div>
              </div>

              {/* Testimonials Grid */}
              <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {TESTIMONIALS.map((t, index) => (
                  <div
                    key={t.name}
                    className={`rounded-2xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900 ${
                      index === 2 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-current"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{t.role}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-300">
                        {t.service}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

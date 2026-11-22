'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Home,
  Store,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Star,
  Wrench,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RepairRequestModal } from '@/components/services/RepairRequestModal';
import { useAuth } from '@/providers/AppProviders';
import { apiFetch } from '@/lib/api';
import { ServiceItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = String(params?.id || '');
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const {
    data: service,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['services', 'detail', serviceId],
    queryFn: async () => {
      const res = await apiFetch<ServiceItem>(`/api/services/${serviceId}`);
      return res.data;
    },
    enabled: Boolean(serviceId),
    retry: false,
  });

  const handleRequestRepairClick = () => {
    if (!user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/services/${serviceId}`)}`);
      return;
    }
    if (user.role !== 'customer') {
      return;
    }
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#1E40AF] dark:text-slate-400 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to All Services
          </Link>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-4">
                <Skeleton className="h-80 w-full rounded-2xl" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-28 w-full" />
              </div>
              <div className="lg:col-span-4">
                <Skeleton className="h-96 w-full rounded-2xl" />
              </div>
            </div>
          ) : isError || !service ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <Wrench className="h-8 w-8" aria-hidden="true" />
              </div>
              <h1 className="mt-4 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
                Service Not Found or Unavailable
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                This repair service listing does not exist, is awaiting admin
                approval, or has been marked unavailable by the technician.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link href="/services">
                  <Button variant="default">Browse Available Services</Button>
                </Link>
                <Link href="/">
                  <Button variant="subtle">Back to Home</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {requestSuccess && (
                <div
                  role="status"
                  className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 sm:flex-row sm:items-center dark:border-emerald-800 dark:bg-emerald-950/60"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                        Repair Request Sent Successfully!
                      </h2>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        Your booking is now in &lsquo;Requested&rsquo; status. Track
                        progress or manage your booking in your dashboard.
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/customer/bookings">
                    <Button variant="success" size="sm">
                      Go to My Bookings
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Left 8 Columns: Service Visual, Description, Reviews */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative h-72 sm:h-96 w-full bg-slate-100 dark:bg-slate-800">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-900/90 px-3.5 py-1 text-xs font-bold text-white">
                          {service.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-bold text-white">
                          {service.serviceMode === 'Home Visit' ? (
                            <Home className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Store className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {service.serviceMode}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin
                            className="h-4 w-4 text-[#1E40AF] dark:text-blue-400"
                            aria-hidden="true"
                          />
                          Coverage: <strong className="text-slate-800 dark:text-slate-200">{service.serviceArea}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock
                            className="h-4 w-4 text-[#1E40AF] dark:text-blue-400"
                            aria-hidden="true"
                          />
                          Est. Duration:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {service.estimatedDuration}
                          </strong>
                        </span>
                        {service.ratingSummary?.average && (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                            <Star
                              className="h-4 w-4 fill-current"
                              aria-hidden="true"
                            />
                            {service.ratingSummary.average} (
                            {service.ratingSummary.count} reviews)
                          </span>
                        )}
                      </div>

                      <h1 className="mt-3 font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                        {service.title}
                      </h1>

                      <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          What This Service Includes
                        </h2>
                        <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {service.description}
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {[
                            'Complete hardware diagnostics before component replacement',
                            'Transparent final bill set only upon completion',
                            'Step-by-step live status tracking in your dashboard',
                            'Secure online payment via Stripe after service delivery',
                          ].map((benefit) => (
                            <div
                              key={benefit}
                              className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                            >
                              <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                                aria-hidden="true"
                              />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Reviews Section */}
                  {service.reviews && service.reviews.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                      <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                        Verified Customer Reviews ({service.reviews.length})
                      </h2>
                      <div className="mt-4 space-y-4">
                        {service.reviews.map((rev, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {rev.customerName}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {formatDate(rev.reviewedAt)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3.5 w-3.5 fill-current"
                                  aria-hidden="true"
                                />
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                              {rev.review}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 4 Columns: Pricing, Booking CTA & Technician Profile */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Booking Action Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-baseline justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Starting Base Price
                        </span>
                        <p className="mt-1 font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(service.basePrice)}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Pay After Service
                      </span>
                    </div>

                    <dl className="mt-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <dt className="text-slate-500">Service Mode</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white">
                          {service.serviceMode}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-slate-500">Estimated Duration</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white">
                          {service.estimatedDuration}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-slate-500">Coverage Area</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white">
                          {service.serviceArea}
                        </dd>
                      </div>
                    </dl>

                    {/* Role-Restricted Request Repair Button */}
                    <div className="mt-6">
                      {user && user.role !== 'customer' ? (
                        <div className="space-y-3">
                          <Button
                            type="button"
                            variant="cta"
                            size="lg"
                            className="w-full"
                            disabled
                          >
                            Request Repair
                          </Button>
                          <div
                            role="note"
                            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                          >
                            <AlertCircle
                              className="h-4 w-4 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span>
                              Only customers can request a repair. You are
                              currently signed in as a{' '}
                              <strong className="capitalize">{user.role}</strong>.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="cta"
                          size="lg"
                          className="w-full"
                          onClick={handleRequestRepairClick}
                        >
                          {user
                            ? 'Request Repair'
                            : 'Sign In to Request Repair'}
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <ShieldCheck
                        className="h-4 w-4 shrink-0 text-[#1E40AF] dark:text-blue-400"
                        aria-hidden="true"
                      />
                      <span>
                        Free cancellation while your request is still in
                        &lsquo;Requested&rsquo; status.
                      </span>
                    </div>
                  </div>

                  {/* Technician Summary Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
                      Assigned Specialist
                    </span>
                    <div className="mt-4 flex items-center gap-3.5">
                      <img
                        src={
                          service.technician?.image ||
                          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                            service.technicianName
                          )}&backgroundColor=1e40af`
                        }
                        alt={service.technicianName}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-100 dark:ring-slate-800"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                            {service.technician?.name || service.technicianName}
                          </h3>
                          <UserCheck
                            className="h-4 w-4 text-[#1E40AF] dark:text-blue-400"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {service.technician?.area || service.serviceArea}
                        </p>
                      </div>
                    </div>

                    {service.technician?.bio && (
                      <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {service.technician.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {user && user.role === 'customer' && (
                <RepairRequestModal
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  service={service}
                  user={user}
                  onSuccess={() => setRequestSuccess(true)}
                />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

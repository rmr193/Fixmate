'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Wrench,
  CheckCheck,
  ArrowRight,
  CreditCard,
  Search,
} from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { JobTimelineTracker } from '@/components/shared/JobTimelineTracker';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { BookingItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CustomerBookingsResponse {
  bookings: BookingItem[];
  stats: {
    totalRequests: number;
    activeJobs: number;
    completedJobs: number;
    unpaidCompletedJobs: number;
    totalSpent: number;
  };
}

export default function CustomerOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'customer'],
    queryFn: async () => {
      const res = await apiFetch<CustomerBookingsResponse>('/api/bookings/my');
      return res.data;
    },
  });

  const stats = (!Array.isArray(data) && data?.stats) || {
    totalRequests: 0,
    activeJobs: 0,
    completedJobs: 0,
    unpaidCompletedJobs: 0,
    totalSpent: 0,
  };
  const bookings: BookingItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.bookings)
    ? data.bookings
    : [];

  const statusDistribution = [
    {
      label: 'Requested',
      count: bookings.filter((b) => b.status === 'requested').length,
      barColor: 'bg-blue-600',
    },
    {
      label: 'Accepted',
      count: bookings.filter((b) => b.status === 'accepted').length,
      barColor: 'bg-indigo-600',
    },
    {
      label: 'In Progress',
      count: bookings.filter((b) => b.status === 'in-progress').length,
      barColor: 'bg-amber-500',
    },
    {
      label: 'Completed',
      count: bookings.filter((b) => b.status === 'completed').length,
      barColor: 'bg-emerald-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
            Customer Portal
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Customer Dashboard Overview
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track your active repair requests, completed jobs, and online
            payments.
          </p>
        </div>

        <Link href="/services">
          <Button variant="cta">
            <Search className="h-4 w-4" aria-hidden="true" />
            Book New Repair
          </Button>
        </Link>
      </div>

      {/* Required Overview Stats Cards: Total Requests, Active Jobs, Completed Jobs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatsCard
          title="Total Requests"
          value={stats.totalRequests}
          subtitle="All repair requests submitted"
          icon={ClipboardList}
          accentColor="blue"
        />
        <StatsCard
          title="Active Jobs"
          value={stats.activeJobs}
          subtitle="Requested, Accepted & In Progress"
          icon={Wrench}
          accentColor="amber"
        />
        <StatsCard
          title="Completed Jobs"
          value={stats.completedJobs}
          subtitle={
            stats.unpaidCompletedJobs > 0
              ? `${stats.unpaidCompletedJobs} job(s) ready for payment`
              : `Total paid: ${formatCurrency(stats.totalSpent)}`
          }
          icon={CheckCheck}
          accentColor="emerald"
        />
      </div>

      {/* Visual Status Breakdown Chart + Payment Alert */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
            Repair Job Pipeline Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visual breakdown of your repair requests by workflow stage
          </p>

          <div className="mt-5 space-y-4">
            {statusDistribution.map((item) => {
              const pct =
                stats.totalRequests > 0
                  ? Math.round((item.count / stats.totalRequests) * 100)
                  : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                      style={{ width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-blue-200 bg-[#EFF6FF] p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E40AF] text-white">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-bold text-slate-900 dark:text-white">
              Pay-After-Service Protection
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Your Stripe payment button activates only when your technician
              completes the repair and sets the final invoice amount.
            </p>
            <div className="mt-4 rounded-xl bg-white p-3.5 border border-blue-100 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Verified Spend</span>
                <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalSpent)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/dashboard/customer/bookings">
              <Button variant="default" size="sm">
                Manage My Bookings
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/dashboard/customer/payments">
              <Button variant="subtle" size="sm">
                Payment History
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bookings Preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Recent Repair Requests
            </h2>
            <p className="text-xs text-slate-500">
              Live status timeline for your latest bookings
            </p>
          </div>
          <Link href="/dashboard/customer/bookings">
            <Button variant="outline" size="sm">
              View All ({bookings.length})
            </Button>
          </Link>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : bookings.length === 0 ? (
            <EmptyState
              title="No repair requests yet"
              description="Browse our verified technician marketplace to book your first device or appliance repair."
              actionLabel="Browse Repair Services"
              actionHref="/services"
            />
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map((booking) => (
                <div
                  key={booking._id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 p-4 sm:flex-row sm:items-center dark:border-slate-800"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                        {booking.serviceTitle}
                      </span>
                      <StatusBadge status={booking.status} />
                      <StatusBadge status={booking.paymentStatus} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Technician: <strong>{booking.technicianName}</strong> &bull;
                      Preferred Date: {formatDate(booking.preferredDate)} &bull;
                      Final Amount:{' '}
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {formatCurrency(booking.finalAmount)}
                      </strong>
                    </p>
                    <JobTimelineTracker
                      status={booking.status}
                      paymentStatus={booking.paymentStatus}
                    />
                  </div>

                  <Link href="/dashboard/customer/bookings">
                    <Button
                      variant={
                        booking.status === 'completed' &&
                        booking.paymentStatus === 'unpaid'
                          ? 'cta'
                          : 'subtle'
                      }
                      size="sm"
                    >
                      {booking.status === 'completed' &&
                      booking.paymentStatus === 'unpaid'
                        ? 'Pay Now'
                        : 'Manage'}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

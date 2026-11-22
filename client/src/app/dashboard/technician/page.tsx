'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  BadgeCheck,
  Inbox,
  PlusCircle,
  ArrowRight,
  Wrench,
  DollarSign,
} from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { BookingItem, ServiceItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TechServicesResponse {
  services: ServiceItem[];
  stats: {
    totalServices: number;
    approvedServices: number;
    pendingServices: number;
    pendingRequests: number;
    activeJobs: number;
    completedJobs: number;
    totalEarnings: number;
  };
}

export default function TechnicianOverviewPage() {
  const { data: serviceData, isLoading: loadingServices } = useQuery({
    queryKey: ['services', 'technician'],
    queryFn: async () => {
      const res = await apiFetch<TechServicesResponse>('/api/services/my');
      return res.data;
    },
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['bookings', 'technician', 'all'],
    queryFn: async () => {
      const res = await apiFetch<BookingItem[]>('/api/bookings/technician');
      return res.data;
    },
  });

  const stats = (!Array.isArray(serviceData) && serviceData?.stats) || {
    totalServices: 0,
    approvedServices: 0,
    pendingServices: 0,
    pendingRequests: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
  };

  const jobBreakdown = [
    {
      label: 'Requested (Awaiting Action)',
      count: requests.filter((r) => r.status === 'requested').length,
      bar: 'bg-blue-600',
    },
    {
      label: 'Accepted (Scheduled)',
      count: requests.filter((r) => r.status === 'accepted').length,
      bar: 'bg-indigo-600',
    },
    {
      label: 'In Progress (Active Repair)',
      count: requests.filter((r) => r.status === 'in-progress').length,
      bar: 'bg-amber-500',
    },
    {
      label: 'Completed (Delivered)',
      count: requests.filter((r) => r.status === 'completed').length,
      bar: 'bg-emerald-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
            Technician Portal
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Technician Dashboard Overview
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your repair service listings, respond to incoming customer
            requests, and track your completed job earnings.
          </p>
        </div>

        <Link href="/dashboard/technician/add-service">
          <Button variant="cta">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add New Service
          </Button>
        </Link>
      </div>

      {/* Required Overview Stats Cards: Total Services, Approved Services, Pending Requests */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatsCard
          title="Total Services"
          value={stats.totalServices}
          subtitle={`${stats.pendingServices} awaiting admin approval`}
          icon={Layers}
          accentColor="blue"
        />
        <StatsCard
          title="Approved Services"
          value={stats.approvedServices}
          subtitle="Live on public repair marketplace"
          icon={BadgeCheck}
          accentColor="emerald"
        />
        <StatsCard
          title="Pending Requests"
          value={stats.pendingRequests}
          subtitle={`${stats.activeJobs} active jobs in progress`}
          icon={Inbox}
          accentColor="orange"
        />
      </div>

      {/* Charts & Earnings Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
            Assigned Job Pipeline Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Distribution of incoming repair bookings assigned to you
          </p>

          <div className="mt-5 space-y-4">
            {jobBreakdown.map((item) => {
              const total = Math.max(requests.length, 1);
              const pct =
                requests.length > 0
                  ? Math.round((item.count / total) * 100)
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
                      className={`h-full rounded-full transition-all duration-500 ${item.bar}`}
                      style={{
                        width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%`,
                      }}
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
              <DollarSign className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-bold text-slate-900 dark:text-white">
              Verified Stripe Earnings
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Revenue earned from completed jobs paid by customers via Stripe
              Checkout.
            </p>
            <div className="mt-4 rounded-xl bg-white p-4 border border-blue-100 dark:bg-slate-800 dark:border-slate-700">
              <span className="text-xs text-slate-500">Total Earned</span>
              <p className="mt-0.5 font-mono text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(stats.totalEarnings)}
              </p>
              <span className="text-[11px] text-slate-500">
                Across {stats.completedJobs} completed repair jobs
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/dashboard/technician/requests">
              <Button variant="default" size="sm">
                Manage Job Requests
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/dashboard/technician/my-services">
              <Button variant="subtle" size="sm">
                My Services
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Incoming Job Requests */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Recent Repair Requests
            </h2>
            <p className="text-xs text-slate-500">
              Latest jobs assigned to your repair services
            </p>
          </div>
          <Link href="/dashboard/technician/requests">
            <Button variant="outline" size="sm">
              Open Request Queue ({requests.length})
            </Button>
          </Link>
        </div>

        <div className="mt-5">
          {loadingServices || loadingRequests ? (
            <TableSkeleton rows={3} />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No incoming job requests yet"
              description="Once customers submit repair requests for your approved services, they will appear here."
              actionLabel="Add a New Service"
              actionHref="/dashboard/technician/add-service"
            />
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 4).map((req) => (
                <div
                  key={req._id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 p-4 sm:flex-row sm:items-center dark:border-slate-800"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                        {req.serviceTitle}
                      </span>
                      <StatusBadge status={req.status} />
                      <StatusBadge status={req.paymentStatus} />
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Customer: <strong>{req.customerName}</strong> (
                      {req.customerPhone}) &bull; Date:{' '}
                      {formatDate(req.preferredDate)} &bull; Address:{' '}
                      {req.address}
                    </p>
                  </div>
                  <Link href="/dashboard/technician/requests">
                    <Button variant="default" size="sm">
                      Update Status
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

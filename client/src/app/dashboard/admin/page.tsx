'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Wrench,
  Hourglass,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { PaymentItem } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface AdminStatsResponse {
  totalUsers: number;
  totalTechnicians: number;
  totalCustomers: number;
  pendingServices: number;
  approvedServices: number;
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  totalTransactions: number;
  bookingsByStatus: Array<{ status: string; count: number }>;
  servicesByCategory: Array<{ category: string; count: number }>;
  recentTransactions: PaymentItem[];
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await apiFetch<AdminStatsResponse>('/api/admin/stats');
      return res.data;
    },
  });

  const kpi = stats || {
    totalUsers: 0,
    totalTechnicians: 0,
    totalCustomers: 0,
    pendingServices: 0,
    approvedServices: 0,
    totalServices: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    bookingsByStatus: [],
    servicesByCategory: [],
    recentTransactions: [],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
            Administrator Console
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Platform Administration Overview
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Moderate technician service listings, manage user roles, monitor all
            repair jobs, and audit verified Stripe revenue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link href="/dashboard/admin/services">
            <Button variant="cta" size="sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Moderate Services ({kpi.pendingServices} Pending)
            </Button>
          </Link>
          <Link href="/dashboard/admin/transactions">
            <Button variant="default" size="sm">
              <Receipt className="h-4 w-4" aria-hidden="true" />
              Revenue Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Required Overview Stats Cards: Total Users, Total Technicians, Pending Services (+ Revenue KPI) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={kpi.totalUsers}
          subtitle={`${kpi.totalCustomers} customers registered`}
          icon={Users}
          accentColor="blue"
        />
        <StatsCard
          title="Total Technicians"
          value={kpi.totalTechnicians}
          subtitle={`${kpi.approvedServices} approved listings`}
          icon={Wrench}
          accentColor="indigo"
        />
        <StatsCard
          title="Pending Services"
          value={kpi.pendingServices}
          subtitle="Awaiting admin moderation"
          icon={Hourglass}
          accentColor="orange"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(kpi.totalRevenue)}
          subtitle={`${kpi.totalTransactions} verified Stripe payments`}
          icon={DollarSign}
          accentColor="emerald"
        />
      </div>

      {/* Dashboard Data Visualization Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Services by Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                Services by Category
              </h2>
              <p className="text-xs text-slate-500">
                Distribution across {kpi.totalServices} listed services
              </p>
            </div>
            <Link href="/dashboard/admin/services">
              <Button variant="ghost" size="sm">
                Moderate
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <div className="mt-5 space-y-3.5">
            {kpi.servicesByCategory.map((item) => {
              const pct =
                kpi.totalServices > 0
                  ? Math.round((item.count / kpi.totalServices) * 100)
                  : 0;
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[#1E40AF] dark:bg-blue-500 transition-all duration-500"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Platform Bookings by Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                Platform Bookings by Status
              </h2>
              <p className="text-xs text-slate-500">
                Live breakdown of {kpi.totalBookings} repair jobs
              </p>
            </div>
            <Link href="/dashboard/admin/bookings">
              <Button variant="ghost" size="sm">
                All Bookings
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <div className="mt-5 space-y-3.5">
            {kpi.bookingsByStatus.map((item) => {
              const pct =
                kpi.totalBookings > 0
                  ? Math.round((item.count / kpi.totalBookings) * 100)
                  : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <StatusBadge status={item.status} />
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Verified Transactions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Latest Stripe Transactions
            </h2>
            <p className="text-xs text-slate-500">
              Verified completed job payments across the platform
            </p>
          </div>
          <Link href="/dashboard/admin/transactions">
            <Button variant="outline" size="sm">
              View All Transactions
            </Button>
          </Link>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Technician</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {kpi.recentTransactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {tx.serviceTitle}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {tx.customerName}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {tx.technicianName}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {tx.transactionId}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateTime(tx.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

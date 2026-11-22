'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { BookingItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const BOOKING_FILTERS = [
  { value: 'all', label: 'All Jobs' },
  { value: 'requested', label: 'Requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminAllBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin', 'bookings', statusFilter],
    queryFn: async () => {
      const qs =
        statusFilter !== 'all'
          ? `?status=${encodeURIComponent(statusFilter)}`
          : '';
      const res = await apiFetch<BookingItem[]>(`/api/admin/bookings${qs}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
            Platform Job Monitor
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            All Platform Bookings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Read-only audit log of every repair request across customers and
            technicians.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {BOOKING_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-[#1E40AF] text-white shadow-2xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No bookings found"
          description="No platform bookings match the selected status filter."
          actionLabel="Show All Bookings"
          onAction={() => setStatusFilter('all')}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Service</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Technician</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Payment Status</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b) => (
                    <tr
                      key={b._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.serviceImage}
                            alt={b.serviceTitle}
                            className="h-10 w-14 shrink-0 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {b.serviceTitle}
                            </p>
                            <p className="text-xs text-slate-500">{b.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {b.customerEmail}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {b.technicianName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {b.technicianEmail}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(b.preferredDate)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={b.paymentStatus} />
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(b.finalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {bookings.map((b) => (
              <div
                key={b._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={b.serviceImage}
                    alt={b.serviceTitle}
                    className="h-14 w-18 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={b.status} />
                      <StatusBadge status={b.paymentStatus} />
                    </div>
                    <h3 className="mt-1.5 font-heading text-base font-bold text-slate-900 dark:text-white">
                      {b.serviceTitle}
                    </h3>
                    <p className="text-xs text-slate-500">{b.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="text-slate-500">Customer</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {b.customerName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Technician</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {b.technicianName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Preferred Date</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDate(b.preferredDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Final Amount</span>
                    <p className="font-mono font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(b.finalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Play,
  CheckCheck,
  Inbox,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { BookingItem, BookingStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Requests' },
  { value: 'requested', label: 'Requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function ManageRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rejectTarget, setRejectTarget] = useState<BookingItem | null>(null);
  const [completeTarget, setCompleteTarget] = useState<BookingItem | null>(
    null
  );
  const [finalAmountInput, setFinalAmountInput] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['bookings', 'technician', statusFilter],
    queryFn: async () => {
      const query =
        statusFilter && statusFilter !== 'all'
          ? `?status=${encodeURIComponent(statusFilter)}`
          : '';
      const res = await apiFetch<BookingItem[]>(
        `/api/bookings/technician${query}`
      );
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: {
      bookingId: string;
      status: BookingStatus;
      finalAmount?: number;
    }) => {
      return apiFetch(`/api/bookings/${payload.bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: payload.status,
          ...(payload.finalAmount !== undefined
            ? { finalAmount: payload.finalAmount }
            : {}),
        }),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Job status updated.');
      setRejectTarget(null);
      setCompleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['bookings', 'technician'] });
      queryClient.invalidateQueries({ queryKey: ['services', 'technician'] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update job status.'
      );
    },
  });

  const openCompleteModal = (booking: BookingItem) => {
    setCompleteTarget(booking);
    setFinalAmountInput(String(booking.basePrice));
    setAmountError('');
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTarget) return;

    const num = Number(finalAmountInput);
    if (isNaN(num) || num <= 0) {
      setAmountError('Final amount must be a valid number greater than 0.');
      return;
    }

    updateStatusMutation.mutate({
      bookingId: completeTarget._id,
      status: 'completed',
      finalAmount: num,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
            Technician Job Pipeline
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Manage Repair Requests
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Move customer repair jobs through the strict status pipeline:{' '}
            <strong>Requested &rarr; Accepted &rarr; In Progress &rarr; Completed</strong>.
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
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
        <TableSkeleton rows={5} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No repair requests found"
          description={
            statusFilter === 'all'
              ? 'You do not have any incoming customer repair requests yet.'
              : `No repair requests currently in '${statusFilter}' status.`
          }
          actionLabel={statusFilter !== 'all' ? 'Show All Requests' : undefined}
          onAction={
            statusFilter !== 'all' ? () => setStatusFilter('all') : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Service &amp; Problem</th>
                    <th className="px-4 py-3.5">Customer &amp; Contact</th>
                    <th className="px-4 py-3.5">Address &amp; Date</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Valid Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.map((booking) => (
                    <tr
                      key={booking._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {booking.serviceTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          &ldquo;{booking.problemDescription}&rdquo;
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {booking.customerName}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          {booking.customerPhone}
                        </p>
                      </td>
                      <td className="px-4 py-4 max-w-[220px]">
                        <p className="inline-flex items-start gap-1 text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                          <MapPin
                            className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400"
                            aria-hidden="true"
                          />
                          {booking.address}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {formatDate(booking.preferredDate)}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs whitespace-nowrap">
                        <span className="text-slate-500">
                          Base: {formatCurrency(booking.basePrice)}
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Final: {formatCurrency(booking.finalAmount)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {/* Strict Action Matrix per Requirement */}
                        {booking.status === 'requested' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              isLoading={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  bookingId: booking._id,
                                  status: 'accepted',
                                })
                              }
                            >
                              <CheckCircle2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Accept
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setRejectTarget(booking)}
                            >
                              <XCircle
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Reject
                            </Button>
                          </div>
                        )}

                        {booking.status === 'accepted' && (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            isLoading={updateStatusMutation.isPending}
                            onClick={() =>
                              updateStatusMutation.mutate({
                                bookingId: booking._id,
                                status: 'in-progress',
                              })
                            }
                          >
                            <Play className="h-3.5 w-3.5" aria-hidden="true" />
                            Start Work
                          </Button>
                        )}

                        {booking.status === 'in-progress' && (
                          <Button
                            type="button"
                            variant="success"
                            size="sm"
                            onClick={() => openCompleteModal(booking)}
                          >
                            <CheckCheck
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Mark Completed
                          </Button>
                        )}

                        {booking.status === 'completed' && (
                          <StatusBadge status={booking.paymentStatus} />
                        )}

                        {(booking.status === 'rejected' ||
                          booking.status === 'cancelled') && (
                          <span className="text-xs font-medium text-slate-400">
                            No Action (Terminal)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {requests.map((booking) => (
              <div
                key={booking._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      {booking.serviceTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Preferred Date: {formatDate(booking.preferredDate)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  &ldquo;{booking.problemDescription}&rdquo;
                </p>

                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-slate-500">Customer</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {booking.customerName} ({booking.customerPhone})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Address</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {booking.address}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Base / Final Amount</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(booking.basePrice)} /{' '}
                      {formatCurrency(booking.finalAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {booking.status === 'requested' && (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        isLoading={updateStatusMutation.isPending}
                        onClick={() =>
                          updateStatusMutation.mutate({
                            bookingId: booking._id,
                            status: 'accepted',
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Accept
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejectTarget(booking)}
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Reject
                      </Button>
                    </>
                  )}

                  {booking.status === 'accepted' && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      isLoading={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          bookingId: booking._id,
                          status: 'in-progress',
                        })
                      }
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      Start Work
                    </Button>
                  )}

                  {booking.status === 'in-progress' && (
                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      onClick={() => openCompleteModal(booking)}
                    >
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Mark Completed
                    </Button>
                  )}

                  {booking.status === 'completed' && (
                    <StatusBadge status={booking.paymentStatus} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mark Completed Modal to Enter Final Amount */}
      <Modal
        isOpen={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        title="Complete Repair Job & Set Final Amount"
        description={
          completeTarget
            ? `Customer: ${completeTarget.customerName} | Service: ${completeTarget.serviceTitle}`
            : ''
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4" noValidate>
          <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-xs dark:bg-blue-950/40 dark:border-blue-900">
            <p className="text-slate-700 dark:text-slate-300">
              Starting Base Price:{' '}
              <strong className="font-mono text-slate-900 dark:text-white">
                {formatCurrency(completeTarget?.basePrice || 0)}
              </strong>
            </p>
            <p className="mt-1 text-slate-500">
              Once marked Completed, the customer&apos;s Stripe &ldquo;Pay
              Now&rdquo; button will unlock for the final amount you enter below.
            </p>
          </div>

          <Input
            label="Final Bill Amount (USD) *"
            type="number"
            step="0.01"
            min="1"
            value={finalAmountInput}
            onChange={(e) => {
              setFinalAmountInput(e.target.value);
              setAmountError('');
            }}
            error={amountError}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="subtle"
              onClick={() => setCompleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={updateStatusMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Confirm Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => {
          if (rejectTarget) {
            updateStatusMutation.mutate({
              bookingId: rejectTarget._id,
              status: 'rejected',
            });
          }
        }}
        title="Reject Repair Request?"
        description={`Are you sure you want to reject ${rejectTarget?.customerName}'s request for "${rejectTarget?.serviceTitle}"? Rejected requests are terminal and cannot be reopened.`}
        confirmLabel="Yes, Reject Request"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}

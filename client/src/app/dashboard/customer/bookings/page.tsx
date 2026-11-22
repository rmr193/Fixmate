'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CreditCard,
  Ban,
  Star,
  Calendar,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { JobTimelineTracker } from '@/components/shared/JobTimelineTracker';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { BookingItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerBookingsPage() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<BookingItem | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'customer'],
    queryFn: async () => {
      const res = await apiFetch<{ bookings: BookingItem[]; stats?: Record<string, number> }>(
        '/api/bookings/my'
      );
      return res.data;
    },
  });

  const bookings: BookingItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.bookings)
    ? data.bookings
    : [];

  // Cancel Booking Mutation (only allowed for status === 'requested')
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiFetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      toast.success('Repair request cancelled.');
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: ['bookings', 'customer'] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to cancel booking.'
      );
    },
  });

  // Stripe Checkout Mutation (only allowed for status === 'completed' && paymentStatus === 'unpaid')
  const handlePayNow = async (booking: BookingItem) => {
    try {
      setPayingBookingId(booking._id);
      const res = await apiFetch<{ url: string; sessionId: string }>(
        '/api/payments/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({ bookingId: booking._id }),
        }
      );

      if (res.data?.url) {
        toast.info('Redirecting to secure Stripe Checkout...');
        window.location.href = res.data.url;
      } else {
        throw new Error('Checkout URL was not returned.');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to initiate payment.'
      );
      setPayingBookingId(null);
    }
  };

  // Optional Review Mutation for Paid Bookings
  const reviewMutation = useMutation({
    mutationFn: async (payload: {
      bookingId: string;
      rating: number;
      review: string;
    }) => {
      return apiFetch(`/api/bookings/${payload.bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating: payload.rating,
          review: payload.review,
        }),
      });
    },
    onSuccess: () => {
      toast.success('Thank you for reviewing your technician!');
      setReviewTarget(null);
      setReviewText('');
      queryClient.invalidateQueries({ queryKey: ['bookings', 'customer'] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to submit review.'
      );
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
          Customer Bookings
        </span>
        <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
          My Repair Bookings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Monitor every repair stage. Cancel pending requests or pay securely
          with Stripe once your technician completes the job.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="You have no repair bookings yet"
          description="Explore our approved repair services to request a technician."
          actionLabel="Browse Services"
          actionHref="/services"
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
                    <th className="px-4 py-3.5">Technician</th>
                    <th className="px-4 py-3.5">Preferred Date</th>
                    <th className="px-4 py-3.5">Base / Final</th>
                    <th className="px-4 py-3.5">Booking Status</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((booking) => {
                    const canCancel = booking.status === 'requested';
                    const canPay =
                      booking.status === 'completed' &&
                      booking.paymentStatus === 'unpaid';
                    const isPaid = booking.paymentStatus === 'paid';

                    return (
                      <tr
                        key={booking._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={booking.serviceImage}
                              alt={booking.serviceTitle}
                              className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                {booking.serviceTitle}
                              </p>
                              <p className="text-xs text-slate-500">
                                {booking.category}
                              </p>
                              <div className="mt-1">
                                <JobTimelineTracker
                                  status={booking.status}
                                  paymentStatus={booking.paymentStatus}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {booking.technicianName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.technicianEmail}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatDate(booking.preferredDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-mono text-xs">
                            <span className="text-slate-500">
                              Base: {formatCurrency(booking.basePrice)}
                            </span>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              Final: {formatCurrency(booking.finalAmount)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={booking.paymentStatus} />
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {canCancel && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setCancelTarget(booking)}
                              >
                                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                                Cancel
                              </Button>
                            )}

                            {canPay && (
                              <Button
                                type="button"
                                variant="cta"
                                size="sm"
                                isLoading={payingBookingId === booking._id}
                                onClick={() => handlePayNow(booking)}
                              >
                                <CreditCard
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                Pay Now
                              </Button>
                            )}

                            {isPaid && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  <ShieldCheck
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                  Paid
                                </span>
                                {!booking.rating && (
                                  <Button
                                    type="button"
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => {
                                      setReviewTarget(booking);
                                      setRating(5);
                                      setReviewText('');
                                    }}
                                  >
                                    <Star
                                      className="h-3.5 w-3.5 text-amber-500"
                                      aria-hidden="true"
                                    />
                                    Rate
                                  </Button>
                                )}
                              </div>
                            )}

                            {!canCancel && !canPay && !isPaid && (
                              <span className="text-xs text-slate-400">
                                {booking.status === 'rejected' ||
                                booking.status === 'cancelled'
                                  ? 'Closed'
                                  : 'In Progress'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {bookings.map((booking) => {
              const canCancel = booking.status === 'requested';
              const canPay =
                booking.status === 'completed' &&
                booking.paymentStatus === 'unpaid';
              const isPaid = booking.paymentStatus === 'paid';

              return (
                <div
                  key={booking._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={booking.serviceImage}
                      alt={booking.serviceTitle}
                      className="h-16 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={booking.status} />
                        <StatusBadge status={booking.paymentStatus} />
                      </div>
                      <h3 className="mt-1.5 font-heading text-base font-bold text-slate-900 dark:text-white">
                        {booking.serviceTitle}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {booking.category}
                      </p>
                    </div>
                  </div>

                  <JobTimelineTracker
                    status={booking.status}
                    paymentStatus={booking.paymentStatus}
                  />

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div>
                      <span className="text-slate-500 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Technician
                      </span>
                      <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                        {booking.technicianName}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        Preferred Date
                      </span>
                      <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                        {formatDate(booking.preferredDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Base Price</span>
                      <p className="mt-0.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(booking.basePrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Final Amount</span>
                      <p className="mt-0.5 font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(booking.finalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {canCancel && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setCancelTarget(booking)}
                      >
                        <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                        Cancel Request
                      </Button>
                    )}

                    {canPay && (
                      <Button
                        type="button"
                        variant="cta"
                        size="sm"
                        isLoading={payingBookingId === booking._id}
                        onClick={() => handlePayNow(booking)}
                      >
                        <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                        Pay Now ({formatCurrency(booking.finalAmount)})
                      </Button>
                    )}

                    {isPaid && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        Paid Verified
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            cancelMutation.mutate(cancelTarget._id);
          }
        }}
        title="Cancel Repair Request?"
        description={`Are you sure you want to cancel your repair request for "${cancelTarget?.serviceTitle}"? Cancelled requests cannot be reopened.`}
        confirmLabel="Yes, Cancel Request"
        cancelLabel="Keep Booking"
        variant="destructive"
        isLoading={cancelMutation.isPending}
      />

      {/* Rate & Review Modal */}
      <Modal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title="Rate Your Repair Experience"
        description={
          reviewTarget
            ? `${reviewTarget.serviceTitle} by ${reviewTarget.technicianName}`
            : ''
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!reviewTarget) return;
            if (reviewText.trim().length < 5) {
              toast.error('Please enter at least 5 characters for your review.');
              return;
            }
            reviewMutation.mutate({
              bookingId: reviewTarget._id,
              rating,
              review: reviewText,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Star Rating
            </label>
            <div className="mt-2 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Your Review *"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share how the technician handled your repair..."
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="subtle"
              onClick={() => setReviewTarget(null)}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={reviewMutation.isPending}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

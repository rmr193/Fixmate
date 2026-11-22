'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { InvoiceModal } from '@/components/shared/InvoiceModal';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { PaymentItem } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function CustomerPaymentsPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentItem | null>(
    null
  );

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'customer'],
    queryFn: async () => {
      const res = await apiFetch<PaymentItem[]>('/api/payments/my');
      return res.data;
    },
  });

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
            Stripe Billing Records
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Payment History
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Verified Stripe receipts for all completed repair jobs.
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-[#EFF6FF] px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Paid
          </span>
          <p className="font-mono text-xl font-extrabold text-[#1E40AF] dark:text-blue-400">
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment transactions yet"
          description="Once your repair job is marked completed by a technician and you pay via Stripe, your receipt will appear here."
          actionLabel="View My Bookings"
          actionHref="/dashboard/customer/bookings"
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Service Title</th>
                    <th className="px-4 py-3.5">Technician</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Transaction ID</th>
                    <th className="px-4 py-3.5">Payment Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        {payment.serviceTitle}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {payment.technicianName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payment.technicianEmail}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {payment.transactionId}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateTime(payment.paidAt)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status="paid" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="subtle"
                          size="sm"
                          onClick={() => setSelectedInvoice(payment)}
                        >
                          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                          Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      {payment.serviceTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Technician: {payment.technicianName}
                    </p>
                  </div>
                  <StatusBadge status="paid" />
                </div>

                <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="text-slate-500">Amount Paid</span>
                    <p className="mt-0.5 font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Date</span>
                    <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                      {formatDateTime(payment.paidAt)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Transaction ID</span>
                    <p className="mt-0.5 truncate font-mono text-slate-700 dark:text-slate-300">
                      {payment.transactionId}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setSelectedInvoice(payment)}
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    View / Print Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <InvoiceModal
        payment={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}

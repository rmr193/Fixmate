'use client';

import React, { useState } from 'react';
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
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
      )}

      <InvoiceModal
        payment={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}

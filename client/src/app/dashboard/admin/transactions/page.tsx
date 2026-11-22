'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Receipt, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { InvoiceModal } from '@/components/shared/InvoiceModal';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { PaymentItem } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface AdminTransactionsResponse {
  payments: PaymentItem[];
  totalRevenue: number;
  totalCount: number;
}

export default function AdminTransactionsPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentItem | null>(
    null
  );

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: async () => {
      const res = await apiFetch<AdminTransactionsResponse>(
        '/api/admin/payments'
      );
      return res.data;
    },
  });

  const payments = data?.payments || [];
  const totalRevenue = data?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
            Stripe Financial Ledger
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            All Platform Transactions
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Verified payment records from completed repair jobs across FixMate.
          </p>
        </div>
      </div>

      {/* Prominent Total Revenue Banner Above the Table */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:flex-row sm:items-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
            <DollarSign className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total Verified Platform Revenue
            </p>
            <p className="mt-1 font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>
        <div className="text-xs text-emerald-900 dark:text-emerald-300">
          Calculated from <strong>{payments.length}</strong> verified Stripe
          payment records
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions recorded yet"
          description="Verified Stripe payments will appear here once customers complete checkout."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Technician</th>
                    <th className="px-4 py-3.5">Service</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Transaction ID</th>
                    <th className="px-4 py-3.5">Payment Date</th>
                    <th className="px-5 py-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((tx) => (
                    <tr
                      key={tx._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {tx.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tx.customerEmail}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {tx.technicianName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tx.technicianEmail}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {tx.serviceTitle}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {tx.transactionId}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateTime(tx.paidAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <StatusBadge status="paid" showIcon={false} />
                          <Button
                            type="button"
                            variant="subtle"
                            size="sm"
                            onClick={() => setSelectedInvoice(tx)}
                          >
                            <FileText
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Receipt
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {payments.map((tx) => (
              <div
                key={tx._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                      {tx.serviceTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(tx.paidAt)}
                    </p>
                  </div>
                  <span className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="text-slate-500">Customer</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {tx.customerName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Technician</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {tx.technicianName}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Transaction ID</span>
                    <p className="truncate font-mono text-slate-700 dark:text-slate-300">
                      {tx.transactionId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <StatusBadge status="paid" />
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={() => setSelectedInvoice(tx)}
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    Receipt
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

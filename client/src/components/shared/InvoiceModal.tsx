'use client';

import { Printer, Wrench, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { PaymentItem } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function InvoiceModal({
  payment,
  onClose,
}: {
  payment: PaymentItem | null;
  onClose: () => void;
}) {
  if (!payment) return null;

  const invoiceNo = `INV-${payment.transactionId.slice(-8).toUpperCase()}`;

  return (
    <Modal
      isOpen={Boolean(payment)}
      onClose={onClose}
      title={`Official Payment Receipt — ${invoiceNo}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E40AF] text-white">
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-lg font-extrabold text-slate-900 dark:text-white">
                FixMate Technologies Ltd.
              </p>
              <p className="text-xs text-slate-500">
                Level 8, Gulshan Avenue, Dhaka-1212
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              PAID VIA STRIPE
            </span>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {formatDateTime(payment.paidAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
            <p className="font-bold uppercase tracking-wider text-slate-400">
              Billed To (Customer)
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {payment.customerName}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {payment.customerEmail}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
            <p className="font-bold uppercase tracking-wider text-slate-400">
              Serviced By (Technician)
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {payment.technicianName}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {payment.technicianEmail}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="px-4 py-3.5">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {payment.serviceTitle}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                    Booking Ref: {payment.bookingId}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-blue-50/70 dark:bg-blue-950/40">
              <tr>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                  Total Paid
                </td>
                <td className="px-4 py-3 text-right font-mono text-base font-extrabold text-[#1E40AF] dark:text-blue-400">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="text-xs text-slate-500 space-y-1 font-mono">
          <p>Stripe Transaction ID: {payment.transactionId}</p>
          <p>Stripe Session ID: {payment.stripeSessionId}</p>
        </div>

        <div className="no-print flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button type="button" variant="subtle" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print / Save PDF Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
}

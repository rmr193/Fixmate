import React from 'react';
import { Check, XCircle, Ban } from 'lucide-react';
import { BookingStatus, PaymentStatus } from '@/types';
import { cn } from '@/lib/utils';

const PIPELINE_STEPS = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'paid', label: 'Paid' },
] as const;

export function JobTimelineTracker({
  status,
  paymentStatus,
}: {
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}) {
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
        {status === 'rejected' ? (
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Ban className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>
          Job terminated ({status === 'rejected' ? 'Rejected by Technician' : 'Cancelled by Customer'})
        </span>
      </div>
    );
  }

  const getActiveIndex = () => {
    if (status === 'completed' && paymentStatus === 'paid') return 4;
    if (status === 'completed') return 3;
    if (status === 'in-progress') return 2;
    if (status === 'accepted') return 1;
    return 0;
  };

  const activeIdx = getActiveIndex();

  return (
    <div
      className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1"
      aria-label={`Job progress: ${status}, payment: ${paymentStatus}`}
    >
      {PIPELINE_STEPS.map((step, index) => {
        const isReached = index <= activeIdx;
        const isCurrent = index === activeIdx;

        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                  isReached
                    ? 'bg-[#1E40AF] text-white dark:bg-blue-500'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                  isCurrent && 'ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900'
                )}
              >
                {isReached ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium whitespace-nowrap',
                  isReached
                    ? 'text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < PIPELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 sm:w-6 shrink-0 rounded-full',
                  index < activeIdx
                    ? 'bg-[#1E40AF] dark:bg-blue-500'
                    : 'bg-slate-200 dark:bg-slate-800'
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

import React from 'react';
import {
  Clock,
  CheckCircle2,
  Wrench,
  CheckCheck,
  XCircle,
  Ban,
  ShieldCheck,
  CreditCard,
  Hourglass,
  BadgeCheck,
  User,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type BadgeType =
  | 'requested'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'paid'
  | 'unpaid'
  | 'pending'
  | 'approved'
  | 'customer'
  | 'technician'
  | 'admin';

const BADGE_CONFIG: Record<
  BadgeType,
  {
    label: string;
    classes: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  requested: {
    label: 'Requested',
    classes:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    classes:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    icon: CheckCircle2,
  },
  'in-progress': {
    label: 'In Progress',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    icon: Wrench,
  },
  completed: {
    label: 'Completed',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCheck,
  },
  rejected: {
    label: 'Rejected',
    classes:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: Ban,
  },
  paid: {
    label: 'Paid',
    classes:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/70 dark:text-emerald-200 dark:border-emerald-700',
    icon: ShieldCheck,
  },
  unpaid: {
    label: 'Unpaid',
    classes:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700',
    icon: CreditCard,
  },
  pending: {
    label: 'Pending',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    icon: Hourglass,
  },
  approved: {
    label: 'Approved',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: BadgeCheck,
  },
  customer: {
    label: 'Customer',
    classes:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    icon: User,
  },
  technician: {
    label: 'Technician',
    classes:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    icon: Wrench,
  },
  admin: {
    label: 'Admin',
    classes:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    icon: ShieldAlert,
  },
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: string;
  className?: string;
  showIcon?: boolean;
}) {
  const key = (status || 'requested').toLowerCase() as BadgeType;
  const config = BADGE_CONFIG[key] || BADGE_CONFIG.requested;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {config.label}
    </span>
  );
}

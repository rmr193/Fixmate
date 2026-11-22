'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { ServiceItem, UserProfile } from '@/types';
import { formatCurrency } from '@/lib/utils';

const bookingRequestSchema = z.object({
  customerPhone: z
    .string()
    .trim()
    .min(6, 'Please enter a valid contact phone number.')
    .max(30, 'Phone number is too long.'),
  address: z
    .string()
    .trim()
    .min(5, 'Please enter a complete service or pickup address.')
    .max(300, 'Address cannot exceed 300 characters.'),
  preferredDate: z
    .string()
    .min(1, 'Preferred service date is required.')
    .refine((val) => {
      const selected = new Date(val);
      if (isNaN(selected.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected.getTime() >= today.getTime();
    }, 'Preferred date must be today or a future date.'),
  problemDescription: z
    .string()
    .trim()
    .min(20, 'Problem description must be at least 20 characters long.')
    .max(2000, 'Problem description cannot exceed 2000 characters.'),
});

type BookingFormValues = z.infer<typeof bookingRequestSchema>;

interface RepairRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem;
  user: UserProfile;
  onSuccess: () => void;
}

export function RepairRequestModal({
  isOpen,
  onClose,
  service,
  user,
  onSuccess,
}: RepairRequestModalProps) {
  const todayIso = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      customerPhone: user.phone || '',
      address: user.area || '',
      preferredDate: todayIso,
      problemDescription: '',
    },
  });

  const problemText = watch('problemDescription') || '';

  const onSubmit = async (values: BookingFormValues) => {
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: service._id,
          ...values,
        }),
      });

      toast.success(
        'Repair request submitted! You can track its live status in My Bookings.'
      );
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to submit repair request.';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit a Repair Request"
      description={`Book ${service.title} with ${service.technicianName}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Summary Bar */}
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs dark:border-blue-900 dark:bg-blue-950/40">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              {service.title}
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              Mode: {service.serviceMode} &bull; Est. {service.estimatedDuration}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500">Base Estimate</span>
            <p className="font-mono text-base font-extrabold text-[#1E40AF] dark:text-blue-400">
              {formatCurrency(service.basePrice)}
            </p>
          </div>
        </div>

        {/* Read-only Customer Session Info */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Your Full Name (From Session)"
            value={user.name}
            readOnly
            disabled
          />
          <Input
            label="Your Email (From Session)"
            value={user.email}
            readOnly
            disabled
          />
        </div>

        {/* Customer Phone & Preferred Date */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Contact Phone Number *"
            placeholder="+880 17XX-XXXXXX"
            error={errors.customerPhone?.message}
            {...register('customerPhone')}
          />
          <Input
            label="Preferred Service Date *"
            type="date"
            min={todayIso}
            error={errors.preferredDate?.message}
            {...register('preferredDate')}
          />
        </div>

        {/* Address */}
        <Input
          label="Service / Pickup Address *"
          placeholder="House, Road, Block, Sector/Area, City"
          error={errors.address?.message}
          {...register('address')}
        />

        {/* Problem Description */}
        <div>
          <Textarea
            label="Problem Description * (Minimum 20 characters)"
            placeholder="Describe the exact symptoms, model name, error codes, or physical damage..."
            error={errors.problemDescription?.message}
            hint={`${problemText.trim().length}/20 minimum characters`}
            {...register('problemDescription')}
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            No upfront payment required. You pay via Stripe only after your
            repair is completed.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="subtle"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="cta" isLoading={isSubmitting}>
            Confirm Repair Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

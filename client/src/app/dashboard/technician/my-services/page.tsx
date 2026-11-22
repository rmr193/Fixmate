'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Power,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { uploadImageToImgBB } from '@/lib/imgbb';
import {
  SERVICE_CATEGORIES,
  SERVICE_MODES,
  ServiceItem,
} from '@/types';
import { formatCurrency } from '@/lib/utils';

const editServiceSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.'),
  category: z.enum(SERVICE_CATEGORIES),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters.'),
  basePrice: z.coerce
    .number()
    .positive('Base price must be greater than 0.'),
  estimatedDuration: z.string().trim().min(2, 'Duration is required.'),
  serviceMode: z.enum(SERVICE_MODES),
  serviceArea: z.string().trim().min(2, 'Service area is required.'),
});

type EditServiceValues = z.infer<typeof editServiceSchema>;

export default function MyServicesPage() {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<ServiceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['services', 'technician'],
    queryFn: async () => {
      const res = await apiFetch<{ services: ServiceItem[] }>(
        '/api/services/my'
      );
      return res.data.services;
    },
  });

  const services = data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditServiceValues>({
    resolver: zodResolver(editServiceSchema),
  });

  const openEditModal = (svc: ServiceItem) => {
    setEditTarget(svc);
    setNewImageFile(null);
    reset({
      title: svc.title,
      category: svc.category,
      description: svc.description,
      basePrice: svc.basePrice,
      estimatedDuration: svc.estimatedDuration,
      serviceMode: svc.serviceMode,
      serviceArea: svc.serviceArea,
    });
  };

  // Toggle Availability Mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: string;
      isAvailable: boolean;
    }) => {
      return apiFetch(`/api/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Availability updated.');
      queryClient.invalidateQueries({ queryKey: ['services', 'technician'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to toggle availability.'
      );
    },
  });

  // Delete Service Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/api/services/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast.success('Service deleted permanently.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['services', 'technician'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete service.'
      );
    },
  });

  // Edit Service Submit (Automatically resets approvalStatus to 'pending' on server)
  const onEditSubmit = async (values: EditServiceValues) => {
    if (!editTarget) return;
    try {
      let imageUrl = editTarget.image;
      if (newImageFile) {
        setUploadingImage(true);
        imageUrl = await uploadImageToImgBB(newImageFile);
        setUploadingImage(false);
      }

      await apiFetch(`/api/services/${editTarget._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...values,
          image: imageUrl,
        }),
      });

      toast.success(
        'Service updated! Approval status has returned to Pending for admin review.'
      );
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['services', 'technician'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch (err) {
      setUploadingImage(false);
      toast.error(
        err instanceof Error ? err.message : 'Failed to update service.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
            Technician Catalog
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            My Repair Services
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Update service details, toggle live availability, or remove old
            listings. Editing a service returns its status to{' '}
            <strong>Pending</strong>.
          </p>
        </div>

        <Link href="/dashboard/technician/add-service">
          <Button variant="cta">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add a Service
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="You haven't listed any repair services yet"
          description="Create your first repair service listing to start receiving job requests from customers."
          actionLabel="Add Your First Service"
          actionHref="/dashboard/technician/add-service"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Category &amp; Mode</th>
                  <th className="px-4 py-3.5">Base Price</th>
                  <th className="px-4 py-3.5">Approval Status</th>
                  <th className="px-4 py-3.5">Availability</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {services.map((svc) => (
                  <tr
                    key={svc._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={svc.image}
                          alt={svc.title}
                          className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {svc.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            Area: {svc.serviceArea} &bull; {svc.estimatedDuration}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {svc.category}
                      </span>
                      <p className="text-xs text-slate-500">
                        {svc.serviceMode}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(svc.basePrice)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={svc.approvalStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAvailabilityMutation.mutate({
                            id: svc._id,
                            isAvailable: !svc.isAvailable,
                          })
                        }
                        aria-pressed={svc.isAvailable}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                          svc.isAvailable
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" aria-hidden="true" />
                        {svc.isAvailable ? 'Available (On)' : 'Hidden (Off)'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="subtle"
                          size="sm"
                          onClick={() => openEditModal(svc)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(svc)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit Repair Service"
        description="Note: Saving edits will reset approvalStatus to 'pending' for admin verification."
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleSubmit(onEditSubmit)}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Service Title *"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Category *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                {...register('category')}
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Service Mode *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                {...register('serviceMode')}
              >
                {SERVICE_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Base Price (USD) *"
              type="number"
              step="0.01"
              error={errors.basePrice?.message}
              {...register('basePrice')}
            />
            <Input
              label="Estimated Duration *"
              error={errors.estimatedDuration?.message}
              {...register('estimatedDuration')}
            />
            <Input
              label="Service Area *"
              error={errors.serviceArea?.message}
              {...register('serviceArea')}
            />
          </div>

          <Textarea
            label="Description *"
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Replace Banner Image (Optional — ImgBB Upload)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1E40AF] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="subtle"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmitting || uploadingImage}
            >
              Save Changes &amp; Resubmit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget._id);
          }
        }}
        title="Delete Repair Service?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? Existing bookings will retain their copied history, but no new bookings can be made.`}
        confirmLabel="Yes, Delete Service"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

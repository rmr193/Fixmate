'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AppProviders';
import { apiFetch } from '@/lib/api';
import { uploadImageToImgBB } from '@/lib/imgbb';
import { SERVICE_CATEGORIES, SERVICE_MODES } from '@/types';

const addServiceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(120, 'Title cannot exceed 120 characters.'),
  category: z.enum(SERVICE_CATEGORIES, {
    message: 'Please select a valid repair category.',
  }),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters.')
    .max(2000, 'Description cannot exceed 2000 characters.'),
  basePrice: z
    .number({ message: 'Please enter a valid base price.' })
    .positive('Base price must be a positive number greater than 0.'),
  estimatedDuration: z
    .string()
    .trim()
    .min(2, 'Estimated duration is required (e.g. "2-3 hours").')
    .max(60, 'Duration is too long.'),
  serviceMode: z.enum(SERVICE_MODES, {
    message: 'Please select a service mode.',
  }),
  serviceArea: z
    .string()
    .trim()
    .min(2, 'Service area is required (e.g. "Dhanmondi, Dhaka").')
    .max(120, 'Service area is too long.'),
});

type AddServiceFormValues = z.infer<typeof addServiceSchema>;

export default function AddServicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddServiceFormValues>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      title: '',
      category: 'Smartphone',
      description: '',
      basePrice: 45,
      estimatedDuration: '2-3 hours',
      serviceMode: 'Home Visit',
      serviceArea: user?.area || 'Dhanmondi, Dhaka',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const onSubmit = async (values: AddServiceFormValues) => {
    if (!imageFile) {
      setImageError('Please upload a service banner image file.');
      toast.error('Please select a service banner image file.');
      return;
    }

    try {
      setUploadingImage(true);
      const uploadedUrl = await uploadImageToImgBB(imageFile);
      setUploadingImage(false);

      await apiFetch('/api/services', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          image: uploadedUrl,
        }),
      });

      toast.success(
        'Service created successfully! It is now waiting for admin approval.'
      );
      queryClient.invalidateQueries({ queryKey: ['services', 'technician'] });
      router.push('/dashboard/technician/my-services');
    } catch (err) {
      setUploadingImage(false);
      toast.error(
        err instanceof Error ? err.message : 'Failed to create service.'
      );
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
          Technician Service Listing
        </span>
        <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
          Add a Repair Service
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Publish a new repair service with an ImgBB banner upload. New services
          are saved as <strong>Pending</strong> until approved by an
          administrator.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Read-only Technician Identity from Session */}
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-slate-800/60">
            <Input
              label="Technician Name (From Session)"
              value={user?.name || ''}
              readOnly
              disabled
            />
            <Input
              label="Technician Email (From Session)"
              value={user?.email || ''}
              readOnly
              disabled
            />
          </div>

          <Input
            label="Service Title *"
            placeholder="e.g. iPhone OLED Screen & Digitizer Replacement"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="service-category"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Category *
              </label>
              <select
                id="service-category"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                {...register('category')}
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category?.message && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Service Mode Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="service-mode"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Service Mode *
              </label>
              <select
                id="service-mode"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                {...register('serviceMode')}
              >
                {SERVICE_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              {errors.serviceMode?.message && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {errors.serviceMode.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Base Starting Price (USD) *"
              type="number"
              step="0.01"
              min="1"
              placeholder="65"
              error={errors.basePrice?.message}
              {...register('basePrice', { valueAsNumber: true })}
            />
            <Input
              label="Estimated Duration *"
              placeholder="e.g. 2-3 hours"
              error={errors.estimatedDuration?.message}
              {...register('estimatedDuration')}
            />
            <Input
              label="Service Area *"
              placeholder="e.g. Dhanmondi, Dhaka"
              error={errors.serviceArea?.message}
              {...register('serviceArea')}
            />
          </div>

          <Textarea
            label="Service Description * (Minimum 20 characters)"
            placeholder="Detail the diagnostic steps, replacement parts quality, warranty period, and what the service covers..."
            error={errors.description?.message}
            {...register('description')}
          />

          {/* ImgBB File Upload Input (File Input, NOT a URL field) */}
          <div className="space-y-2">
            <label
              htmlFor="service-image-file"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Service Banner Image (ImgBB File Upload) *
            </label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition-colors hover:border-[#1E40AF] dark:border-slate-700 dark:bg-slate-800/40">
              {imagePreview ? (
                <div className="w-full space-y-3">
                  <img
                    src={imagePreview}
                    alt="Selected service banner preview"
                    className="mx-auto h-48 w-full max-w-md rounded-xl object-cover shadow-xs"
                  />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {imageFile?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-400">
                    <UploadCloud className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Choose an image file to upload via ImgBB
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG or WEBP up to 5MB
                  </p>
                </div>
              )}

              <input
                id="service-image-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-3 block w-full max-w-xs text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1E40AF] file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1E3A8A] file:cursor-pointer dark:text-slate-300"
              />
            </div>
            {imageError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {imageError}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 border border-blue-200 px-4 py-3 text-xs text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Your service will be saved with{' '}
              <strong>approvalStatus: pending</strong> and{' '}
              <strong>isAvailable: true</strong> until reviewed by an Admin.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="subtle"
              onClick={() => router.push('/dashboard/technician/my-services')}
              disabled={isSubmitting || uploadingImage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cta"
              size="lg"
              isLoading={isSubmitting || uploadingImage}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              {uploadingImage
                ? 'Uploading Image to ImgBB...'
                : 'Publish Service for Approval'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

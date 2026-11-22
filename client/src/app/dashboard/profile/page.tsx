'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Save, UserCheck } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/providers/AppProviders';
import { apiFetch } from '@/lib/api';
import { uploadImageToImgBB } from '@/lib/imgbb';
import { UserProfile } from '@/types';

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(80, 'Full name cannot exceed 80 characters.'),
  phone: z.string().trim().max(30, 'Phone number is too long.').optional(),
  area: z.string().trim().max(100, 'Area cannot exceed 100 characters.').optional(),
  bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters.').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function UpdateProfilePage() {
  const { user, updateUserState } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      area: user?.area || '',
      bio: user?.bio || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        area: user.area || '',
        bio: user.bio || '',
      });
      setPhotoPreview(user.image || '');
    }
  }, [user, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      let imageUrl = user?.image || '';
      if (photoFile) {
        setUploadingPhoto(true);
        imageUrl = await uploadImageToImgBB(photoFile);
        setUploadingPhoto(false);
      }

      const res = await apiFetch<{ token: string; user: UserProfile }>(
        '/api/users/profile',
        {
          method: 'PATCH',
          body: JSON.stringify({
            ...values,
            image: imageUrl,
          }),
        }
      );

      // Immediately update AuthContext state so Navbar and Dashboard Top Bar reflect new name & photo without logging out
      updateUserState(res.data.user, res.data.token);
      setPhotoFile(null);
      toast.success(
        'Profile updated! Your new details are now active across FixMate.'
      );
    } catch (err) {
      setUploadingPhoto(false);
      toast.error(
        err instanceof Error ? err.message : 'Failed to update profile.'
      );
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
          Account Settings
        </span>
        <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
          Update Your Profile
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Keep your contact details, area, bio, and ImgBB profile photo up to
          date.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Avatar Upload Header */}
          <div className="flex flex-col items-start gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center dark:border-slate-800">
            <div className="relative">
              <img
                src={
                  photoPreview ||
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    user.name
                  )}&backgroundColor=1e40af`
                }
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-100 dark:ring-slate-800"
              />
              <label
                htmlFor="profile-photo-input"
                aria-label="Upload new profile photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#1E40AF] text-white shadow-md hover:bg-[#1E3A8A] cursor-pointer"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </label>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  {user.name}
                </h2>
                <StatusBadge status={user.role} />
              </div>
              <p className="text-xs text-slate-500">
                Upload a profile photo via ImgBB (JPG, PNG, WEBP up to 5MB)
              </p>
              <input
                id="profile-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full max-w-xs text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#1E40AF] hover:file:bg-blue-100 file:cursor-pointer dark:text-slate-400"
              />
            </div>
          </div>

          {/* Read-only Email & Role */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email Address (Read-Only)"
              value={user.email}
              readOnly
              disabled
            />
            <Input
              label="Account Role (Read-Only)"
              value={user.role.toUpperCase()}
              readOnly
              disabled
            />
          </div>

          {/* Editable Profile Fields */}
          <Input
            label="Full Name *"
            placeholder="Your full name"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Contact Phone Number"
              placeholder="+880 17XX-XXXXXX"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="City / Service Area"
              placeholder="e.g. Mirpur, Dhaka"
              error={errors.area?.message}
              {...register('area')}
            />
          </div>

          <Textarea
            label="Short Bio (Skills, Experience, or Preferences)"
            placeholder="Tell customers or technicians about your background, certifications, or repair specialties..."
            error={errors.bio?.message}
            {...register('bio')}
          />

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <UserCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Changes sync immediately across your session</span>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              isLoading={isSubmitting || uploadingPhoto}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {uploadingPhoto ? 'Uploading Photo...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

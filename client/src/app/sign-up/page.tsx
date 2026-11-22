'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Wrench, User, CheckCircle2, Circle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AppProviders';
import { getDashboardPathByRole } from '@/lib/utils';

const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long.')
    .max(80, 'Full name cannot exceed 80 characters.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.'),
  role: z.enum(['customer', 'technician'], {
    errorMap: () => ({
      message: 'Please choose either Customer or Technician.',
    }),
  }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { user, isLoading, register: registerUser, loginWithGoogle } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle('/dashboard');
    } catch (err) {
      setGoogleLoading(false);
      const msg =
        err instanceof Error ? err.message : 'Failed to continue with Google.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'customer',
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDashboardPathByRole(user.role));
    }
  }, [isLoading, user, router]);

  const selectedRole = watch('role');
  const passwordVal = watch('password') || '';

  const hasMinLen = passwordVal.length >= 6;
  const hasUpper = /[A-Z]/.test(passwordVal);
  const hasLower = /[a-z]/.test(passwordVal);

  const onSubmit = async (values: SignUpFormValues) => {
    setServerError(null);
    try {
      const createdUser = await registerUser(values);
      toast.success(
        `Account created! Welcome to FixMate as a ${createdUser.role}.`
      );
      router.push(getDashboardPathByRole(createdUser.role));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create account.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-lg sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E40AF] text-white shadow-xs">
              <Wrench className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
              Create Your FixMate Account
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Choose your role below to start booking repairs or offering your
              technical services
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
            >
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 space-y-5"
            noValidate
          >
            {/* Role Selection Cards (Only Customer & Technician allowed — Admin never selectable) */}
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Select Account Role *
              </label>
              <div
                role="radiogroup"
                aria-label="Account role selection"
                className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === 'customer'}
                  onClick={() =>
                    setValue('role', 'customer', { shouldValidate: true })
                  }
                  className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                    selectedRole === 'customer'
                      ? 'border-[#1E40AF] bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E40AF] text-white">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Customer
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Book repairs, track jobs &amp; pay after service
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === 'technician'}
                  onClick={() =>
                    setValue('role', 'technician', { shouldValidate: true })
                  }
                  className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                    selectedRole === 'technician'
                      ? 'border-[#1E40AF] bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EA580C] text-white">
                    <Wrench className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Technician
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      List repair services &amp; manage customer jobs
                    </p>
                  </div>
                </button>
              </div>
              {errors.role?.message && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-red-600"
                >
                  {errors.role.message}
                </p>
              )}
            </div>

            <Input
              label="Full Name *"
              placeholder="e.g. Tanvir Ahmed"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Password *"
                type="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Live Password Rules Checklist */}
              <div className="mt-2.5 grid grid-cols-1 gap-1.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 sm:grid-cols-3">
                {[
                  { ok: hasMinLen, label: '6+ characters' },
                  { ok: hasUpper, label: '1+ uppercase (A-Z)' },
                  { ok: hasLower, label: '1+ lowercase (a-z)' },
                ].map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-1.5 font-medium ${
                      rule.ok
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {rule.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Create {selectedRole === 'technician' ? 'Technician' : 'Customer'}{' '}
              Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 font-semibold text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                Or sign up with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="subtle"
            size="lg"
            className="w-full font-semibold"
            isLoading={googleLoading}
            onClick={handleGoogleSignUp}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google (Customer Role)
          </Button>

          <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            Already have a FixMate account?{' '}
            <Link
              href="/sign-in"
              className="font-bold text-[#1E40AF] hover:underline dark:text-blue-400"
            >
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

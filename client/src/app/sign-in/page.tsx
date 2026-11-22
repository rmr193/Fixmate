'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Wrench, Lock, KeyRound, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AppProviders';
import { getDashboardPathByRole } from '@/lib/utils';

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { user, isLoading, login, loginWithGoogle } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      const target =
        redirectParam && redirectParam.startsWith('/')
          ? redirectParam
          : getDashboardPathByRole(user.role);
      router.replace(target);
    }
  }, [isLoading, user, redirectParam, router]);

  const onSubmit = async (values: SignInFormValues) => {
    setServerError(null);
    try {
      const loggedInUser = await login(values.email, values.password);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      const target =
        redirectParam && redirectParam.startsWith('/')
          ? redirectParam
          : getDashboardPathByRole(loggedInUser.role);
      router.push(target);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Invalid email or password.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  const fillDemoAccount = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setServerError(null);
  };

  const handleGoogleSignIn = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      const target =
        redirectParam && redirectParam.startsWith('/')
          ? redirectParam
          : '/dashboard';
      await loginWithGoogle(target);
    } catch (err) {
      setGoogleLoading(false);
      const msg =
        err instanceof Error ? err.message : 'Failed to sign in with Google.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-lg sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E40AF] text-white shadow-xs">
            <Wrench className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Sign In to FixMate
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Access your repair bookings, technician workspace, or admin console
          </p>
        </div>

        {/* Quick Demo Credential Selector for Evaluators */}
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-900 dark:bg-blue-950/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E40AF] dark:text-blue-400">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Quick Fill Demo Accounts</span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                fillDemoAccount('customer@fixmate.com', 'Customer@123456')
              }
              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:border-[#1E40AF] hover:text-[#1E40AF] cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() =>
                fillDemoAccount('tech@fixmate.com', 'Tech@123456')
              }
              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:border-[#1E40AF] hover:text-[#1E40AF] cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Technician
            </button>
            <button
              type="button"
              onClick={() =>
                fillDemoAccount('admin@fixmate.com', 'Admin@123456')
              }
              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:border-[#1E40AF] hover:text-[#1E40AF] cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Admin
            </button>
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
          >
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 space-y-4"
          noValidate
        >
          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-semibold text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Social Login Button */}
        <Button
          type="button"
          variant="subtle"
          size="lg"
          className="w-full font-semibold"
          isLoading={googleLoading}
          onClick={handleGoogleSignIn}
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
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/sign-up"
            className="font-bold text-[#1E40AF] hover:underline dark:text-blue-400"
          >
            Create an Account
            <ArrowRight className="inline h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Suspense fallback={<div className="py-20 text-sm">Loading...</div>}>
          <SignInFormContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

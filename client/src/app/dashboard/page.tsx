'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AppProviders';
import { getDashboardPathByRole } from '@/lib/utils';

export default function DashboardIndexRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/sign-in');
      } else {
        router.replace(getDashboardPathByRole(user.role));
      }
    }
  }, [isLoading, user, router]);

  return null;
}

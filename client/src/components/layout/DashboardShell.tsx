'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wrench,
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  PlusCircle,
  Layers,
  Inbox,
  Users,
  ShieldCheck,
  Receipt,
  UserCog,
  Home,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AppProviders';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getDashboardPathByRole } from '@/lib/utils';
import { UserRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_MENU: Record<UserRole, NavItem[]> = {
  customer: [
    {
      href: '/dashboard/customer',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/customer/bookings',
      label: 'My Bookings',
      icon: ClipboardList,
    },
    {
      href: '/dashboard/customer/payments',
      label: 'Payment History',
      icon: CreditCard,
    },
    {
      href: '/dashboard/profile',
      label: 'Update Profile',
      icon: UserCog,
    },
  ],
  technician: [
    {
      href: '/dashboard/technician',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/technician/add-service',
      label: 'Add a Service',
      icon: PlusCircle,
    },
    {
      href: '/dashboard/technician/my-services',
      label: 'My Services',
      icon: Layers,
    },
    {
      href: '/dashboard/technician/requests',
      label: 'Manage Requests',
      icon: Inbox,
    },
    {
      href: '/dashboard/profile',
      label: 'Update Profile',
      icon: UserCog,
    },
  ],
  admin: [
    {
      href: '/dashboard/admin',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/admin/users',
      label: 'Manage Users',
      icon: Users,
    },
    {
      href: '/dashboard/admin/services',
      label: 'Service Approval',
      icon: ShieldCheck,
    },
    {
      href: '/dashboard/admin/bookings',
      label: 'All Bookings',
      icon: ClipboardList,
    },
    {
      href: '/dashboard/admin/transactions',
      label: 'Transactions',
      icon: Receipt,
    },
    {
      href: '/dashboard/profile',
      label: 'Update Profile',
      icon: UserCog,
    },
  ],
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, pathname, router]);

  // While restoring session on page reload, show skeleton loader (NEVER redirect a logged-in user!)
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="hidden w-64 border-r border-slate-200 bg-white p-5 lg:block dark:border-slate-800 dark:bg-slate-900">
          <Skeleton className="h-10 w-40" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Role-based route access verification
  const isCustomerRoute = pathname.startsWith('/dashboard/customer');
  const isTechnicianRoute = pathname.startsWith('/dashboard/technician');
  const isAdminRoute = pathname.startsWith('/dashboard/admin');

  const isForbiddenRole =
    (isCustomerRoute && user.role !== 'customer') ||
    (isTechnicianRoute && user.role !== 'technician') ||
    (isAdminRoute && user.role !== 'admin');

  const menuItems = ROLE_MENU[user.role] || ROLE_MENU.customer;

  const handleSignOut = async () => {
    await logout();
    toast.success('Signed out successfully.');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Collapsible Sidebar */}
      <aside
        aria-label="Dashboard Sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Brand Logo */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E40AF] text-white shadow-xs">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-heading text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Fix<span className="text-[#1E40AF] dark:text-blue-400">Mate</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role Indicator Header */}
          <div className="px-5 pt-5 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {user.role} Workspace
            </p>
          </div>

          {/* Dynamic Navigation Items */}
          <nav className="space-y-1 px-3 py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExactOverview =
                item.href === '/dashboard/customer' ||
                item.href === '/dashboard/technician' ||
                item.href === '/dashboard/admin';
              const isActive = isExactOverview
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#1E40AF] text-white font-semibold shadow-2xs dark:bg-blue-600'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer: Back to Home & Sign Out */}
        <div className="border-t border-slate-200 p-4 space-y-1.5 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Home className="h-4 w-4 text-[#1E40AF] dark:text-blue-400" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open dashboard sidebar"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/services"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1E40AF] dark:text-slate-400 dark:hover:text-blue-400"
            >
              Browse Marketplace
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-2 pr-3 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <img
                src={
                  user.image ||
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    user.name
                  )}&backgroundColor=1e40af`
                }
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {user.email}
                </p>
              </div>
              <StatusBadge status={user.role} showIcon={false} />
            </Link>
          </div>
        </header>

        {/* Page Body or 403 Forbidden Role Guard */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {isForbiddenRole ? (
            <div className="mx-auto my-12 max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <ShieldAlert className="h-7 w-7" aria-hidden="true" />
              </div>
              <h1 className="mt-4 font-heading text-xl font-extrabold text-slate-900 dark:text-white">
                403 Forbidden — Role Restricted Access
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Your account role is{' '}
                <strong className="capitalize text-slate-900 dark:text-white">
                  {user.role}
                </strong>
                . You do not have permission to view another role&apos;s
                dashboard.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link href={getDashboardPathByRole(user.role)}>
                  <Button variant="default">
                    Go to My {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="subtle">Return Home</Button>
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

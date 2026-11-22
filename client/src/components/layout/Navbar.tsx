'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wrench,
  Menu,
  X,
  LayoutDashboard,
  UserCog,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AppProviders';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn, getDashboardPathByRole } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'How It Works / About' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    toast.success('You have been signed out safely.');
    router.push('/');
  };

  const dashboardHref = getDashboardPathByRole(user?.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Consistent Brand Logo across all pages */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E40AF] text-white shadow-xs">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-heading text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Fix<span className="text-[#1E40AF] dark:text-blue-400">Mate</span>
          </span>
        </Link>

        {/* Desktop Public Navigation */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main Navigation"
        >
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-[#1E40AF] font-semibold dark:bg-blue-950/70 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle + Auth State */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {!user ? (
            <div className="flex items-center gap-2.5">
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label="Open user account menu"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-2 pr-3 text-left transition-colors hover:border-blue-300 hover:bg-white cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <img
                  src={
                    user.image ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                      user.name
                    )}&backgroundColor=1e40af`
                  }
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-[#1E40AF]/20"
                />
                <div className="hidden lg:block max-w-[130px]">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] capitalize text-slate-500 dark:text-slate-400">
                    {user.role}
                  </p>
                </div>
                <ChevronDown
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <StatusBadge status={user.role} showIcon={false} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1.5 space-y-0.5">
                    <Link
                      href={dashboardHref}
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#1E40AF] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    >
                      <LayoutDashboard
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#1E40AF] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    >
                      <UserCog
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      Update Profile
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <LogOut
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="space-y-1">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block rounded-xl px-3.5 py-2.5 text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 text-[#1E40AF] font-semibold dark:bg-blue-950/70 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="default" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <img
                    src={
                      user.image ||
                      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                        user.name
                      )}&backgroundColor=1e40af`
                    }
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <StatusBadge status={user.role} showIcon={false} />
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#1E40AF]" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <UserCog className="h-4 w-4 text-[#1E40AF]" />
                    Update Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

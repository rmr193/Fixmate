'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users, Shield, Search } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AppProviders';
import { apiFetch } from '@/lib/api';
import { UserProfile, UserRole } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminManageUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', roleFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const qs = params.toString();
      const res = await apiFetch<UserProfile[]>(
        `/api/admin/users${qs ? `?${qs}` : ''}`
      );
      return res.data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: UserRole;
    }) => {
      return apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'User role updated.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update user role.'
      );
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
            User &amp; Role Administration
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Manage Platform Users
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View all registered accounts and assign roles. Administrators cannot
            modify their own role.
          </p>
        </div>

        {/* Search & Role Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or email..."
              aria-label="Search users by name or email"
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-[#1E40AF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter users by role"
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#1E40AF] focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="technician">Technicians</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match your filter"
          description="Try clearing your search or role filter."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Area &amp; Phone</th>
                    <th className="px-4 py-3.5">Current Role</th>
                    <th className="px-4 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => {
                    const isSelf =
                      currentUser?._id === u._id ||
                      currentUser?.email.toLowerCase() === u.email.toLowerCase();

                    return (
                      <tr
                        key={u._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                u.image ||
                                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                                  u.name
                                )}&backgroundColor=1e40af`
                              }
                              alt={u.name}
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {u.name}
                              </p>
                              {isSelf && (
                                <span className="text-[11px] font-semibold text-[#1E40AF] dark:text-blue-400">
                                  (You)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">
                          {u.email}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                          <p>{u.area || 'Dhaka'}</p>
                          {u.phone && (
                            <p className="text-slate-400">{u.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={u.role} />
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {isSelf || u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                              Single Admin Locked
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={roleMutation.isPending}
                              onChange={(e) =>
                                roleMutation.mutate({
                                  userId: u._id,
                                  role: e.target.value as UserRole,
                                })
                              }
                              aria-label={`Change role for ${u.name}`}
                              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#1E40AF] focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              <option value="customer">Customer</option>
                              <option value="technician">Technician</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {users.map((u) => {
              const isSelf =
                currentUser?._id === u._id ||
                currentUser?.email.toLowerCase() === u.email.toLowerCase();

              return (
                <div
                  key={u._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          u.image ||
                          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                            u.name
                          )}&backgroundColor=1e40af`
                        }
                        alt={u.name}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {u.name} {isSelf && '(You)'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={u.role} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div>
                      <span className="text-slate-500">Area</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {u.area || 'Dhaka'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Joined</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(u.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-500">
                      Account Role
                    </span>
                    {isSelf || u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                        <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                        Single Admin Locked
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={roleMutation.isPending}
                        onChange={(e) =>
                          roleMutation.mutate({
                            userId: u._id,
                            role: e.target.value as UserRole,
                          })
                        }
                        aria-label={`Change role for ${u.name}`}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#1E40AF] focus:outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="customer">Customer</option>
                        <option value="technician">Technician</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

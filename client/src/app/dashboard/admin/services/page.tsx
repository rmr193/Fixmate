'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { ApprovalStatus, ServiceItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const APPROVAL_FILTERS = [
  { value: 'all', label: 'All (Pending First)' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminServiceApprovalPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin', 'services', statusFilter],
    queryFn: async () => {
      const qs =
        statusFilter !== 'all'
          ? `?approvalStatus=${encodeURIComponent(statusFilter)}`
          : '';
      const res = await apiFetch<ServiceItem[]>(`/api/admin/services${qs}`);
      return res.data;
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({
      serviceId,
      approvalStatus,
    }: {
      serviceId: string;
      approvalStatus: ApprovalStatus;
    }) => {
      return apiFetch(`/api/admin/services/${serviceId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus }),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Service approval status updated.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update approval status.'
      );
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
            Catalog Quality Assurance
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Technician Service Approval
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Review and moderate repair services submitted or edited by
            technicians. Pending listings are prioritized first.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {APPROVAL_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-[#1E40AF] text-white shadow-2xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No services found for this filter"
          description="There are no technician services matching the selected approval status."
          actionLabel="Show All Services"
          onAction={() => setStatusFilter('all')}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Service</th>
                    <th className="px-4 py-3.5">Technician</th>
                    <th className="px-4 py-3.5">Category &amp; Mode</th>
                    <th className="px-4 py-3.5">Base Price</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {services.map((svc) => (
                    <tr
                      key={svc._id}
                      className={
                        svc.approvalStatus === 'pending'
                          ? 'bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-950/15 dark:hover:bg-amber-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }
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
                              {svc.serviceArea} &bull; {formatDate(svc.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {svc.technicianName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {svc.technicianEmail}
                        </p>
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
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="success"
                            size="sm"
                            disabled={
                              svc.approvalStatus === 'approved' ||
                              approvalMutation.isPending
                            }
                            onClick={() =>
                              approvalMutation.mutate({
                                serviceId: svc._id,
                                approvalStatus: 'approved',
                              })
                            }
                          >
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={
                              svc.approvalStatus === 'rejected' ||
                              approvalMutation.isPending
                            }
                            onClick={() =>
                              approvalMutation.mutate({
                                serviceId: svc._id,
                                approvalStatus: 'rejected',
                              })
                            }
                          >
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {services.map((svc) => (
              <div
                key={svc._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={svc.image}
                    alt={svc.title}
                    className="h-16 w-20 shrink-0 rounded-xl object-cover bg-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={svc.approvalStatus} />
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {svc.category}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-heading text-base font-bold text-slate-900 dark:text-white">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Technician: {svc.technicianName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="text-slate-500">Base Price</span>
                    <p className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(svc.basePrice)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Mode &amp; Area</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {svc.serviceMode} ({svc.serviceArea})
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={
                      svc.approvalStatus === 'approved' ||
                      approvalMutation.isPending
                    }
                    onClick={() =>
                      approvalMutation.mutate({
                        serviceId: svc._id,
                        approvalStatus: 'approved',
                      })
                    }
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={
                      svc.approvalStatus === 'rejected' ||
                      approvalMutation.isPending
                    }
                    onClick={() =>
                      approvalMutation.mutate({
                        serviceId: svc._id,
                        approvalStatus: 'rejected',
                      })
                    }
                  >
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

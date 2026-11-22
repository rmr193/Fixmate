'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import {
  PaginationMeta,
  SERVICE_CATEGORIES,
  SERVICE_MODES,
  ServiceItem,
} from '@/types';

function BrowseServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlMode = searchParams.get('serviceMode') || 'all';
  const urlSort = searchParams.get('sort') || 'newest';
  const urlPage = Math.max(
    1,
    parseInt(searchParams.get('page') || '1', 10) || 1
  );

  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const updateUrlParams = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      const strVal = String(value).trim();
      if (!strVal || strVal === 'all' || (key === 'page' && strVal === '1')) {
        params.delete(key);
      } else {
        params.set(key, strVal);
      }
    });
    const queryStr = params.toString();
    router.push(queryStr ? `/services?${queryStr}` : '/services');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    router.push('/services');
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      'services',
      'list',
      urlSearch,
      urlCategory,
      urlMode,
      urlSort,
      urlPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (urlSearch) params.set('search', urlSearch);
      if (urlCategory && urlCategory !== 'all')
        params.set('category', urlCategory);
      if (urlMode && urlMode !== 'all') params.set('serviceMode', urlMode);
      if (urlSort) params.set('sort', urlSort);
      params.set('page', String(urlPage));
      params.set('limit', '9');

      const res = await apiFetch<ServiceItem[]>(
        `/api/services?${params.toString()}`
      );
      return {
        services: res.data,
        pagination: (res.meta?.pagination as PaginationMeta) || {
          total: res.data.length,
          page: 1,
          limit: 9,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    },
  });

  const services = data?.services || [];
  const pagination = data?.pagination;
  const hasActiveFilters =
    Boolean(urlSearch) ||
    urlCategory !== 'all' ||
    urlMode !== 'all' ||
    urlSort !== 'newest';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] dark:text-blue-400">
            Verified Repair Marketplace
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
            Browse Approved Repair Services
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Search and filter server-verified technicians by device category,
            Home Visit or Shop Drop-off mode, and transparent base price.
          </p>
        </div>

        {/* Challenge 1 Controls: Search, Category Filter, Service Mode Filter, Sort Dropdown */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12">
          <form
            onSubmit={handleSearchSubmit}
            className="flex gap-2 md:col-span-5"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, category, or area..."
                aria-label="Search services by title or category"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <Button type="submit" variant="default">
              Search
            </Button>
          </form>

          {/* Category Select */}
          <div className="md:col-span-3">
            <select
              value={urlCategory}
              onChange={(e) =>
                updateUrlParams({ category: e.target.value, page: 1 })
              }
              aria-label="Filter by category"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 cursor-pointer dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Service Mode Select */}
          <div className="md:col-span-2">
            <select
              value={urlMode}
              onChange={(e) =>
                updateUrlParams({ serviceMode: e.target.value, page: 1 })
              }
              aria-label="Filter by service mode"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 cursor-pointer dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Modes</option>
              {SERVICE_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="md:col-span-2">
            <select
              value={urlSort}
              onChange={(e) =>
                updateUrlParams({ sort: e.target.value, page: 1 })
              }
              aria-label="Sort services"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 cursor-pointer dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Quick Pills + Active Filter Summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-blue-200/60 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateUrlParams({ category: 'all', page: 1 })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                urlCategory === 'all'
                  ? 'bg-[#1E40AF] text-white'
                  : 'bg-white text-slate-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              All
            </button>
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateUrlParams({ category: cat, page: 1 })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  urlCategory === cat
                    ? 'bg-[#1E40AF] text-white'
                    : 'bg-white text-slate-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
          <span>
            Showing{' '}
            <strong className="text-slate-900 dark:text-white">
              {services.length}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-900 dark:text-white">
              {pagination?.total ?? 0}
            </strong>{' '}
            verified repair services
          </span>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
        )}
      </div>

      {/* Services Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <ServiceCardSkeleton key={idx} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            title="No matching repair services found"
            description="We couldn't find any approved services matching your current search or filter criteria. Try clearing your filters or searching another category."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </div>

      {/* Challenge 4: Server-Side Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <nav
          aria-label="Services Pagination"
          className="mt-10 flex items-center justify-center gap-2"
        >
          <Button
            type="button"
            variant="subtle"
            size="sm"
            disabled={!pagination.hasPrevPage}
            onClick={() => updateUrlParams({ page: pagination.page - 1 })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: pagination.totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === pagination.page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => updateUrlParams({ page: pageNum })}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#1E40AF] text-white shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="subtle"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => updateUrlParams({ page: pagination.page + 1 })}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}

export default function BrowseServicesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <ServiceCardSkeleton key={idx} />
                ))}
              </div>
            </div>
          }
        >
          <BrowseServicesContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

import Link from 'next/link';
import {
  MapPin,
  Clock,
  UserCheck,
  Home,
  Store,
  ArrowRight,
} from 'lucide-react';
import { ServiceItem } from '@/types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export function ServiceCard({ service }: { service: ServiceItem }) {
  const isHomeVisit = service.serviceMode === 'Home Visit';

  return (
    <article className="group flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800">
      <div>
        {/* Fixed-Ratio Uniform Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={service.image}
            alt={service.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
              {service.category}
            </span>
          </div>
          <div className="absolute right-3 top-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs ${
                isHomeVisit
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/95 text-slate-900'
              }`}
            >
              {isHomeVisit ? (
                <Home className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Store className="h-3 w-3" aria-hidden="true" />
              )}
              {service.serviceMode}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5">
          <h3 className="line-clamp-1 font-heading text-lg font-bold text-slate-900 group-hover:text-[#1E40AF] dark:text-white dark:group-hover:text-blue-400">
            {service.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600 dark:text-slate-400">
            {service.description}
          </p>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3.5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <UserCheck
                className="h-4 w-4 shrink-0 text-[#1E40AF] dark:text-blue-400"
                aria-hidden="true"
              />
              <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                {service.technicianName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 truncate">
                <MapPin
                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <span className="truncate">{service.serviceArea}</span>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0 text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {service.estimatedDuration}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Equal Footer with Starting Price & View Details Button */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
        <div>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Starting at
          </span>
          <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(service.basePrice)}
          </span>
        </div>

        <Link href={`/services/${service._id}`}>
          <Button variant="default" size="sm">
            View Details
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </article>
  );
}

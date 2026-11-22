import React from 'react';
import Link from 'next/link';
import { Wrench, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/types';

/**
 * Modern X Logo SVG (Requirement: Use the new X logo instead of the old Twitter bird)
 */
function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E40AF] text-white shadow-xs">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-heading text-xl font-extrabold tracking-tight text-white">
                Fix<span className="text-blue-400">Mate</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Smart Device &amp; Home Appliance Repair Service Platform. Connect
              with background-verified technicians, track every repair milestone,
              and pay securely only after job completion.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              100% Pay-After-Completion Guarantee
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Browse All Services
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  How FixMate Works &amp; About
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Become a Verified Technician
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Popular Categories
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SERVICE_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    href={`/services?category=${encodeURIComponent(category)}`}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {category} Repair
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info & Social */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Contact &amp; Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
                  aria-hidden="true"
                />
                <span>Level 8, Gulshan Avenue, Gulshan-2, Dhaka-1212, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone
                  className="h-4 w-4 shrink-0 text-blue-400"
                  aria-hidden="true"
                />
                <span>+880 1711-000100 (7 AM – 11 PM)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail
                  className="h-4 w-4 shrink-0 text-blue-400"
                  aria-hidden="true"
                />
                <span>support@fixmate.com</span>
              </li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow FixMate on X"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white"
              >
                <XLogoIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow FixMate on LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white"
              >
                <LinkedInIcon className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow FixMate on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} FixMate Technologies Ltd. All
            rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-slate-300">
              Service Verification Policy
            </Link>
            <Link href="/services" className="hover:text-slate-300">
              Repair Marketplace
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

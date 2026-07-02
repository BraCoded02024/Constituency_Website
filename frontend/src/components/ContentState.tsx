'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { RefreshCw } from 'lucide-react';

export function CardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="npp-card overflow-hidden animate-pulse">
          <div className="h-52 bg-gray-200" />
          <div className="p-6 space-y-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-5 w-full bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-4/5 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="npp-card flex flex-col lg:flex-row overflow-hidden animate-pulse">
          <div className="h-52 lg:w-[380px] shrink-0 bg-gray-200" />
          <div className="flex-1 p-8 space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-7 w-2/3 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-2.5 w-full bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  filtered?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  filtered = false,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-npp-blue/8 border border-npp-blue/10 mb-5">
        <Icon size={28} className="text-npp-blue/70" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {filtered ? 'No matches found' : title}
      </h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
        {filtered ? 'Try a different search term or filter.' : description}
      </p>
      {actionLabel && actionHref && !filtered ? (
        <Link
          href={actionHref}
          className="inline-flex mt-6 items-center bg-npp-red text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-npp-red-dark transition-colors shadow-sm"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="flex-1">Showing saved constituency updates — live feed is temporarily unavailable.</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 font-medium text-npp-blue hover:underline shrink-0"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      ) : null}
    </div>
  );
}

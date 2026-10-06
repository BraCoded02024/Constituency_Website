'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useDeferredEffect } from '@/lib/useDeferredEffect';
import { followUpLabel, type FollowUpFeed } from '@/components/admin/FollowUpBell';

export default function FollowUpAlert() {
  const [feed, setFeed] = useState<FollowUpFeed | null>(null);

  const load = useCallback(() => {
    api.delegateDashboard.getFollowUps(4)
      .then((data) => setFeed(data as FollowUpFeed))
      .catch(() => setFeed(null));
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  const due = feed?.dueCount ?? 0;
  const upcoming = feed?.upcoming ?? 0;
  if (!feed || (due === 0 && upcoming === 0)) return null;

  const urgent = due > 0;
  const names = feed.items.slice(0, 3);

  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 ${urgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className={`text-sm font-semibold inline-flex items-center gap-2 ${urgent ? 'text-red-800' : 'text-amber-900'}`}>
          <span
            className={`w-2.5 h-2.5 rounded-full ${urgent ? 'bg-red-600' : 'bg-amber-500'}`}
            style={{ animation: 'followBlink 1s steps(1) infinite' }}
          />
          <span style={{ animation: 'followBlink 1.4s steps(1) infinite' }}>
            {urgent
              ? `${due} ${due === 1 ? 'person needs' : 'people need'} a follow-up`
              : `${upcoming} follow-up${upcoming === 1 ? '' : 's'} coming up`}
          </span>
        </p>
        <Link href="/admin/follow-ups" className="text-xs font-semibold text-npp-blue hover:underline">
          Open the list
        </Link>
      </div>
      <ul className="mt-2 space-y-1">
        {names.map((item) => (
          <li key={item.id} className="text-sm text-gray-800">
            <Link href={`/admin/delegates/${item.id}`} className="font-medium text-npp-blue hover:underline">
              {item.fullName}
            </Link>
            <span className="text-gray-600">
              {' '}needs follow-up · {followUpLabel(item.timing)} · {item.nextFollowUpAt}
              {item.electoralAreaName ? ` · ${item.electoralAreaName}` : ''}
            </span>
          </li>
        ))}
      </ul>
      <style>{`@keyframes followBlink { 50% { opacity: 0.2; } }`}</style>
    </div>
  );
}

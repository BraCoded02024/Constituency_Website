'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useDeferredEffect } from '@/lib/useDeferredEffect';
import {
  followUpLabel,
  followUpTone,
  type FollowUpFeed,
  type FollowUpItem,
} from '@/components/admin/FollowUpBell';
import { SmsDialog } from '@/components/admin/SmsPanel';

function Group({
  title,
  hint,
  items,
  onText,
}: {
  title: string;
  hint: string;
  items: FollowUpItem[];
  onText: (item: FollowUpItem) => void;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-500">None in this group.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/admin/delegates/${item.id}`} className="text-sm font-medium text-npp-blue hover:underline">
                  {item.fullName}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.delegateCode || 'No code'}
                  {item.phone ? ` · ${item.phone}` : ''}
                  {item.electoralAreaName ? ` · ${item.electoralAreaName}` : ''}
                  {item.position ? ` · ${item.position}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">{item.nextFollowUpAt}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${followUpTone(item.timing)}`}>
                  {followUpLabel(item.timing)}
                </span>
                <button
                  type="button"
                  onClick={() => onText(item)}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700"
                >
                  Send SMS
                </button>
                <Link
                  href={`/admin/delegates/${item.id}/survey`}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-npp-blue text-white"
                >
                  Record contact
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function FollowUpsPage() {
  const [feed, setFeed] = useState<FollowUpFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [texting, setTexting] = useState<FollowUpItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.delegateDashboard.getFollowUps(200)
      .then((data) => setFeed(data as FollowUpFeed))
      .catch(() => toast.error('Failed to load follow-ups'))
      .finally(() => setLoading(false));
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  if (loading && !feed) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>;
  }

  const items = feed?.items || [];
  const due = items.filter((item) => item.timing === 'overdue' || item.timing === 'today');
  const upcoming = items.filter((item) => item.timing === 'upcoming');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="text-npp-blue" size={22} /> Follow-ups
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {feed?.dueCount ?? 0} due now
          {(feed?.overdue ?? 0) > 0 ? `, including ${feed?.overdue} overdue` : ''}.
          {' '}{feed?.upcoming ?? 0} scheduled in the next 14 days.
          A date is set from Record Survey on the delegate profile.
        </p>
      </div>
      <Group title="Due now" hint="These people should be followed up today or are already past the date." items={due} onText={setTexting} />
      <Group title="Coming up" hint="Scheduled within the next 14 days." items={upcoming} onText={setTexting} />
      {texting && (
        <SmsDialog
          delegateId={texting.id}
          name={texting.fullName}
          phone={texting.phone}
          onClose={() => setTexting(null)}
        />
      )}
    </div>
  );
}

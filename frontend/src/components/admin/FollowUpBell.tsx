'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

export interface FollowUpItem {
  id: string;
  fullName: string;
  delegateCode: string | null;
  phone: string | null;
  position: string | null;
  electoralAreaName: string | null;
  nextFollowUpAt: string;
  currentStatus: string | null;
  timing: 'overdue' | 'today' | 'upcoming';
}

export interface FollowUpFeed {
  overdue: number;
  dueToday: number;
  upcoming: number;
  dueCount: number;
  items: FollowUpItem[];
}

export function followUpLabel(timing: FollowUpItem['timing']) {
  if (timing === 'overdue') return 'Overdue';
  if (timing === 'today') return 'Due today';
  return 'Coming up';
}

export function followUpTone(timing: FollowUpItem['timing']) {
  if (timing === 'overdue') return 'bg-red-50 text-red-700';
  if (timing === 'today') return 'bg-amber-50 text-amber-800';
  return 'bg-blue-50 text-blue-700';
}

export default function FollowUpBell() {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<FollowUpFeed | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.delegateDashboard.getFollowUps(8)
      .then((data) => setFeed(data as FollowUpFeed))
      .catch(() => setFeed(null));
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const dueCount = feed?.dueCount ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          load();
        }}
        className="relative w-9 h-9 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center"
        aria-label={dueCount > 0 ? `${dueCount} follow-ups due` : 'Follow-up notifications'}
      >
        <Bell size={18} className={(dueCount > 0 || (feed?.upcoming ?? 0) > 0) ? 'origin-top' : undefined} style={(dueCount > 0 || (feed?.upcoming ?? 0) > 0) ? { animation: 'followBell 1.2s ease-in-out infinite' } : undefined} />
        {dueCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-4 text-center" style={{ animation: 'followBlink 1s steps(1) infinite' }}>
            {dueCount > 99 ? '99+' : dueCount}
          </span>
        ) : (feed?.upcoming ?? 0) > 0 ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" style={{ animation: 'followBlink 1s steps(1) infinite' }} />
        ) : null}
        <style>{`@keyframes followBlink { 50% { opacity: 0.15; } } @keyframes followBell { 0%, 100% { transform: rotate(0); } 20% { transform: rotate(16deg); } 40% { transform: rotate(-12deg); } 60% { transform: rotate(8deg); } }`}</style>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Follow-ups</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {dueCount > 0
                ? `${dueCount} ${dueCount === 1 ? 'person needs' : 'people need'} a follow-up now.`
                : 'Nobody is due right now.'}
              {(feed?.upcoming ?? 0) > 0 ? ` ${feed?.upcoming} coming up in the next 14 days.` : ''}
            </p>
          </div>
          {!feed || feed.items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">
              No follow-up dates yet. Set the next follow-up when you record a survey.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {feed.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/delegates/${item.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{item.fullName}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${followUpTone(item.timing)}`}>
                        {followUpLabel(item.timing)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.nextFollowUpAt}
                      {item.electoralAreaName ? ` · ${item.electoralAreaName}` : ''}
                      {item.position ? ` · ${item.position}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/follow-ups"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-sm font-medium text-npp-blue border-t border-gray-100 hover:bg-gray-50"
          >
            Open follow-up list
          </Link>
        </div>
      )}
    </div>
  );
}

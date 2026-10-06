'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import { History, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

interface ActivityItem {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.activity.getAll({ limit: 100 })
      .then((d) => setItems(d as ActivityItem[]))
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setLoading(false));
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="text-npp-blue" size={22} /> Activity Log
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Delegate-module audit trail (no passwords or ID numbers).</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">
          No activity recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.action.replace(/_/g, ' ')}
                    <span className="text-gray-400 font-normal"> · {item.entity}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.actorName || 'System'}
                    {item.entityId ? ` · ${item.entityId.slice(0, 8)}…` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

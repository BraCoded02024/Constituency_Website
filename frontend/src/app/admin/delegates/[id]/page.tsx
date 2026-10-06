'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Delegate, SurveyRecord } from '@/lib/delegateTypes';
import { ArrowLeft, Edit2, Loader2, ClipboardList } from 'lucide-react';
import { SmsPanel } from '@/components/admin/SmsPanel';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value || '—'}</dd>
    </div>
  );
}

export default function DelegateProfilePage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.delegates.getById(id),
      api.delegates.getSurveys(id),
    ])
      .then(([d, s]) => {
        setDelegate(d as Delegate);
        setSurveys(s as SurveyRecord[]);
      })
      .catch(() => {
        toast.error('Failed to load delegate');
        router.replace('/admin/delegates');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  useDeferredEffect(() => { load(); }, [load]);

  if (loading || !delegate) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link href="/admin/delegates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-npp-blue mb-2">
            <ArrowLeft size={16} /> Delegates
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{delegate.fullName}</h1>
          <p className="text-sm text-npp-blue font-mono">{delegate.delegateCode || 'No code'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/delegates/${id}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Edit2 size={16} /> Edit Profile
          </Link>
          <Link
            href={`/admin/delegates/${id}/survey`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium hover:bg-npp-blue/90"
          >
            <ClipboardList size={16} /> Record Survey
          </Link>
        </div>
      </div>

      {delegate.nextFollowUpAt && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          delegate.nextFollowUpAt.slice(0, 10) < new Date().toISOString().slice(0, 10)
            ? 'bg-red-50 border-red-100 text-red-800'
            : delegate.nextFollowUpAt.slice(0, 10) === new Date().toISOString().slice(0, 10)
              ? 'bg-amber-50 border-amber-100 text-amber-900'
              : 'bg-blue-50 border-blue-100 text-blue-900'
        }`}>
          {delegate.nextFollowUpAt.slice(0, 10) <= new Date().toISOString().slice(0, 10)
            ? `${delegate.fullName} has to be followed up.`
            : `${delegate.fullName} is scheduled for a follow-up.`}
          {' '}Date: {delegate.nextFollowUpAt.slice(0, 10)}.
        </div>
      )}

      <SmsPanel delegateId={delegate.id} name={delegate.fullName} phone={delegate.phone} />

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Identity</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row label="Phone" value={delegate.phone} />
          <Row label="Email" value={delegate.email} />
          <Row label="Ghana Card" value={delegate.ghanaCard} />
          <Row label="Voter ID" value={delegate.votersId} />
          <Row label="Gender" value={delegate.gender} />
          <Row label="Age" value={delegate.age != null ? String(delegate.age) : null} />
          <Row label="Status" value={delegate.status} />
        </dl>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Location</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row label="Electoral Area" value={delegate.electoralAreaName} />
          <Row label="Polling Station" value={delegate.pollingStationLabel || delegate.pollingStationName} />
          <Row label="Station Code" value={delegate.pollingStationCode} />
          <Row label="Community" value={delegate.community} />
          <Row label="Address" value={delegate.address} />
        </dl>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Classification</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row label="Level" value={delegate.level} />
          <Row label="Position" value={delegate.position || delegate.categoryName} />
          <Row label="Flagged" value={delegate.isFlagged ? 'Yes' : 'No'} />
          <Row label="Active" value={delegate.isActive === false ? 'No' : 'Yes'} />
          <Row label="Notes" value={delegate.notes} />
        </dl>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Current Survey State</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row label="Status" value={delegate.currentStatus || 'Not surveyed'} />
          <Row label="Confidence" value={delegate.currentConfidence} />
          <Row label="Last Contacted" value={delegate.lastContactedAt} />
          <Row label="Next Follow-up" value={delegate.nextFollowUpAt} />
        </dl>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Survey History</h2>
        {surveys.length === 0 ? (
          <p className="text-sm text-gray-500">No surveys recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {surveys.map((s) => (
              <li key={s.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">{s.status} · {s.confidence}</span>
                  <span className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Officer: {s.createdByName || '—'}</p>
                <p className="text-xs text-gray-500">Contacted: {s.lastContactedAt || '—'} · Follow-up: {s.nextFollowUpAt || '—'}</p>
                {s.notes && <p className="text-sm text-gray-700 mt-2">{s.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

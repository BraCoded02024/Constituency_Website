'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Delegate } from '@/lib/delegateTypes';
import { SURVEY_STATUS_OPTIONS } from '@/lib/delegateTypes';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

const CONFIDENCE_OPTIONS = ['High', 'Medium', 'Low'] as const;

export default function RecordSurveyPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Supporting');
  const [confidence, setConfidence] = useState('High');
  const [lastContactedAt, setLastContactedAt] = useState(new Date().toISOString().slice(0, 10));
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [notes, setNotes] = useState('');

  useDeferredEffect(() => {
    api.delegates.getById(id)
      .then((d) => setDelegate(d as Delegate))
      .catch(() => {
        toast.error('Delegate not found');
        router.replace('/admin/delegates');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastContactedAt) {
      toast.error('Last contacted is required');
      return;
    }
    setSaving(true);
    try {
      await api.delegates.recordSurvey(id, {
        status,
        confidence,
        lastContactedAt,
        nextFollowUpAt: nextFollowUpAt || null,
        notes: notes || null,
      });
      toast.success('Survey recorded');
      router.push(`/admin/delegates/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record survey');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !delegate) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>;
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-npp-blue/30';

  return (
    <div className="max-w-xl space-y-4">
      <Link href={`/admin/delegates/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-npp-blue">
        <ArrowLeft size={16} /> Back to profile
      </Link>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Record Survey</h1>
        <p className="text-sm text-gray-500">{delegate.fullName} · {delegate.delegateCode}</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status *</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {SURVEY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Confidence</label>
          <select className={inputCls} value={confidence} onChange={(e) => setConfidence(e.target.value)}>
            {CONFIDENCE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last Contacted *</label>
          <input type="date" className={inputCls} value={lastContactedAt} onChange={(e) => setLastContactedAt(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Next Follow-up</label>
          <input type="date" className={inputCls} value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea className={inputCls} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Link href={`/admin/delegates/${id}`} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</Link>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Submit Survey
          </button>
        </div>
      </form>
    </div>
  );
}

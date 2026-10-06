'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type { ElectoralArea } from '@/lib/delegateTypes';
import { MapPinned, Plus, Edit2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

const empty = { name: '', code: '', description: '', isActive: true };

function classTone(label: string) {
  if (label === 'Strong') return 'bg-green-50 text-green-700';
  if (label === 'Needs attention') return 'bg-red-50 text-red-700';
  if (label === 'Persuasion') return 'bg-amber-50 text-amber-800';
  if (label === 'Unclassified') return 'bg-blue-50 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

export default function ElectoralAreasPage() {
  const [items, setItems] = useState<ElectoralArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.electoralAreas.getAll({ active: true })
      .then((d) => setItems(d as ElectoralArea[]))
      .catch(() => toast.error('Failed to load areas'))
      .finally(() => setLoading(false));
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (a: ElectoralArea) => {
    setEditId(a.id);
    setForm({
      name: a.name,
      code: a.code || '',
      description: a.description || '',
      isActive: a.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code || null,
        description: form.description || null,
        isActive: form.isActive,
      };
      if (editId) await api.electoralAreas.update(editId, payload);
      else await api.electoralAreas.create(payload);
      toast.success(editId ? 'Area updated' : 'Area created');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const visible = items.filter((area) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return area.name.toLowerCase().includes(q) || (area.code || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPinned className="text-npp-blue" size={22} /> Electoral Areas
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {items.length} areas on the delegate roll. Classification uses surveyed delegates: Strong at 50% supporting, Needs attention at 25% not supporting, Persuasion at 18% floating.
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium">
          <Plus size={16} /> Add Area
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search area or code"
        className="w-full max-w-sm px-3 py-2 border border-gray-200 rounded-xl text-sm"
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">No electoral areas match.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Stations</th>
                  <th className="px-4 py-3">Delegates</th>
                  <th className="px-4 py-3">Surveyed</th>
                  <th className="px-4 py-3">Supporting</th>
                  <th className="px-4 py-3">Not supporting</th>
                  <th className="px-4 py-3">Floating</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.code || '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{a.stationCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="tabular-nums">{a.delegateCount ?? 0}</div>
                      <div className="text-[11px] text-gray-400">
                        {a.areaDelegateCount ?? 0} area · {a.stationDelegateCount ?? 0} station
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{a.surveyed ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums text-green-700">{a.supporting ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums text-red-700">{a.notSupporting ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-700">{a.floating ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(a.classifications || ['Not surveyed']).map((label) => (
                          <span key={label} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${classTone(label)}`}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-npp-blue">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editId ? 'Edit Area' : 'New Area'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="text-xs text-gray-600">Name *</label>
              <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Code</label>
              <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Description</label>
              <textarea className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-xl border text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-2 rounded-xl bg-npp-blue text-white text-sm disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

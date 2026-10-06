'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type { ElectoralArea, PollingStation } from '@/lib/delegateTypes';
import { Landmark, Plus, Edit2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

const empty = { name: '', code: '', description: '', electoralAreaId: '', isActive: true };

export default function PollingStationsPage() {
  const [items, setItems] = useState<PollingStation[]>([]);
  const [areas, setAreas] = useState<ElectoralArea[]>([]);
  const [filterArea, setFilterArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.pollingStations.getAll(filterArea ? { electoralAreaId: filterArea } : undefined)
      .then((d) => setItems(d as PollingStation[]))
      .catch(() => toast.error('Failed to load stations'))
      .finally(() => setLoading(false));
  }, [filterArea]);

  useDeferredEffect(() => {
    api.electoralAreas.getAll({ active: true }).then((d) => setAreas(d as ElectoralArea[])).catch(() => {});
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...empty, electoralAreaId: filterArea || '' });
    setShowForm(true);
  };

  const openEdit = (s: PollingStation) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      code: s.code || '',
      description: s.description || '',
      electoralAreaId: s.electoralAreaId,
      isActive: s.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.electoralAreaId) {
      toast.error('Name and electoral area are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code || null,
        description: form.description || null,
        electoralAreaId: form.electoralAreaId,
        isActive: form.isActive,
      };
      if (editId) await api.pollingStations.update(editId, payload);
      else await api.pollingStations.create(payload);
      toast.success(editId ? 'Station updated' : 'Station created');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="text-npp-blue" size={22} /> Polling Stations
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Each station must belong to an electoral area.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium">
          <Plus size={16} /> Add Station
        </button>
      </div>

      <select
        className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        value={filterArea}
        onChange={(e) => setFilterArea(e.target.value)}
      >
        <option value="">All areas</option>
        {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">No polling stations found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Electoral Area</th>
                <th className="px-4 py-3">Delegates</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.code || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.electoralAreaName || '—'}</td>
                  <td className="px-4 py-3">{s.delegateCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-npp-blue">
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editId ? 'Edit Station' : 'New Station'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="text-xs text-gray-600">Electoral Area *</label>
              <select
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                value={form.electoralAreaId}
                onChange={(e) => setForm({ ...form, electoralAreaId: e.target.value })}
                required
              >
                <option value="">Select area</option>
                {areas.filter((a) => a.isActive || a.id === form.electoralAreaId).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
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

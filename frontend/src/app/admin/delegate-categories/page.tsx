'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type { DelegateCategory } from '@/lib/delegateTypes';
import { Tags, Plus, Edit2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

const empty = { name: '', description: '', isActive: true };

export default function DelegateCategoriesPage() {
  const [items, setItems] = useState<DelegateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.delegateCategories.getAll()
      .then((d) => setItems(d as DelegateCategory[]))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (c: DelegateCategory) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      description: c.description || '',
      isActive: c.isActive,
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
        description: form.description || null,
        isActive: form.isActive,
      };
      if (editId) await api.delegateCategories.update(editId, payload);
      else await api.delegateCategories.create(payload);
      toast.success(editId ? 'Category updated' : 'Category created');
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Tags className="text-npp-blue" size={22} /> Delegate Categories
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Configure categories used when registering delegates.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">No categories yet.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Delegates</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.description || '—'}</td>
                  <td className="px-4 py-3">{c.delegateCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-npp-blue">
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
              <h2 className="font-semibold">{editId ? 'Edit Category' : 'New Category'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="text-xs text-gray-600">Name *</label>
              <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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

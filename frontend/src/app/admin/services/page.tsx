'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

const ICONS = ['FileText', 'Briefcase', 'GraduationCap', 'Heart', 'Building', 'Users', 'Shield', 'Wrench', 'Car', 'Leaf'];
const CATEGORIES = ['Civil Services', 'Business', 'Education', 'Health', 'Infrastructure', 'Employment', 'Security', 'Agriculture'];

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ title: '', description: '', icon: 'FileText', category: 'Civil Services' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.services.getAll()
      .then(data => setItems(data as Service[]))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', icon: 'FileText', category: 'Civil Services' }); setShowForm(true); };

  const openEdit = (item: Service) => { setEditing(item); setForm({ title: item.title, description: item.description, icon: item.icon, category: item.category }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.services.update(editing.id, form); toast.success('Updated'); }
      else { await api.services.create(form); toast.success('Created'); }
      setShowForm(false); load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.services.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ghana-green" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900">Services</h1><p className="text-sm text-gray-500">{items.length} total</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-xl text-sm font-medium hover:bg-ghana-green/90"><Plus size={16} /> Add New</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit' : 'New'} Service</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Icon</label><select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none">{ICONS.map(i => <option key={i}>{i}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium bg-ghana-green text-white hover:bg-ghana-green/90 disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />}{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {items.map(item => (
          <div key={item.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-ghana-green/10 flex items-center justify-center text-ghana-green text-xs font-bold">{item.icon.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{item.category}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-ghana-green"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-8 text-center text-sm text-gray-400">No services yet</p>}
      </div>
    </div>
  );
}

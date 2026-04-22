'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Loader2, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface Story {
  id: string;
  name: string;
  story: string;
  image: string;
  year: string;
}

export default function AdminStoriesPage() {
  const [items, setItems] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Story | null>(null);
  const [form, setForm] = useState({ name: '', story: '', image: '', year: new Date().getFullYear().toString() });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.successStories.getAll()
      .then(data => setItems(data as Story[]))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', story: '', image: '', year: new Date().getFullYear().toString() }); setShowForm(true); };

  const openEdit = (item: Story) => { setEditing(item); setForm({ name: item.name, story: item.story, image: item.image, year: item.year }); setShowForm(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      const base = typeof window !== 'undefined' ? `http://${window.location.hostname}:5001` : '';
      setForm(f => ({ ...f, image: base + url }));
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.story) { toast.error('Name and story required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.successStories.update(editing.id, form); toast.success('Updated'); }
      else { await api.successStories.create(form); toast.success('Created'); }
      setShowForm(false); load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.successStories.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ghana-green" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900">Success Stories</h1><p className="text-sm text-gray-500">{items.length} stories</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-xl text-sm font-medium hover:bg-ghana-green/90"><Plus size={16} /> Add Story</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit' : 'New'} Success Story</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Story</label><textarea value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Year</label><input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                <div className="flex gap-2">
                  <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
                  <label className="flex items-center px-3 py-2.5 rounded-xl border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}<input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
                </div>
                {form.image && <img src={form.image} alt="" className="mt-2 w-20 h-20 rounded-full object-cover" />}
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
          <div key={item.id} className="p-4 flex items-start gap-4">
            {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{item.story}</p>
              <span className="text-[10px] text-gray-400">{item.year}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-ghana-green"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-8 text-center text-sm text-gray-400">No success stories yet</p>}
      </div>
    </div>
  );
}

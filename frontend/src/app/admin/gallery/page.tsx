'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Loader2, X, Upload, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
}

const CATEGORIES = ['Infrastructure', 'Health', 'Education', 'Governance', 'Water & Sanitation', 'Events', 'Community', 'Other'];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState({ title: '', image: '', category: 'Other', date: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.gallery.getAll()
      .then(data => setItems(data as GalleryItem[]))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', image: '', category: 'Other', date: new Date().toISOString().split('T')[0] }); setShowForm(true); };

  const openEdit = (item: GalleryItem) => { setEditing(item); setForm({ title: item.title, image: item.image, category: item.category, date: item.date }); setShowForm(true); };

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
    if (!form.title || !form.image) { toast.error('Title and image required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.gallery.update(editing.id, form); toast.success('Updated'); }
      else { await api.gallery.create(form); toast.success('Added'); }
      setShowForm(false); load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.gallery.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ghana-green" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900">Gallery</h1><p className="text-sm text-gray-500">{items.length} items</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-xl text-sm font-medium hover:bg-ghana-green/90"><Plus size={16} /> Add Image</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit' : 'Add'} Gallery Item</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex gap-2">
                  <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
                  <label className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}<input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
                </div>
                {form.image && <img src={form.image} alt="" className="mt-2 w-full h-40 object-cover rounded-lg" />}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" /></div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium bg-ghana-green text-white hover:bg-ghana-green/90 disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />}{editing ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
            <div className="relative">
              <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => openEdit(item)} className="p-2 rounded-full bg-white/90 text-ghana-green hover:bg-white"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 rounded-full bg-white/90 text-red-500 hover:bg-white"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">{item.category}</span>
                <span className="text-[10px] text-gray-400">{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="p-8 text-center text-sm text-gray-400 bg-white rounded-xl border border-gray-100">No gallery items yet</p>}
    </div>
  );
}

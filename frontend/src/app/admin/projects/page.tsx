'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/mediaUrl';
import { Plus, Pencil, Trash2, Loader2, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  budget: string;
  startDate: string;
  endDate: string;
  contractor: string;
  category: string;
  image?: string;
}

const STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold'];
const CATEGORIES = ['Infrastructure', 'Education', 'Health', 'Water & Sanitation', 'Commerce', 'Agriculture'];

export default function AdminProjectsPage() {
  const searchParams = useSearchParams();
  const appliedEditRef = useRef<string | null>(null);
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', status: 'Planning', progress: 0, budget: '',
    startDate: '', endDate: '', contractor: '', category: 'Infrastructure', image: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.projects.getAll()
      .then(data => setItems(data as Project[]))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', status: 'Planning', progress: 0, budget: '', startDate: '', endDate: '', contractor: '', category: 'Infrastructure', image: '' });
    setShowForm(true);
  };

  const openEdit = (item: Project) => {
    setEditing(item);
    setForm({
      title: item.title, description: item.description, status: item.status, progress: item.progress,
      budget: item.budget, startDate: item.startDate, endDate: item.endDate, contractor: item.contractor,
      category: item.category, image: item.image || '',
    });
    setShowForm(true);
  };

  useEffect(() => {
    const eid = searchParams.get('edit');
    if (!eid) {
      appliedEditRef.current = null;
      return;
    }
    if (items.length === 0) return;
    const p = items.find(x => x.id === eid);
    if (!p) return;
    if (appliedEditRef.current === eid) return;
    appliedEditRef.current = eid;
    setEditing(p);
    setForm({
      title: p.title, description: p.description, status: p.status, progress: p.progress,
      budget: p.budget, startDate: p.startDate, endDate: p.endDate, contractor: p.contractor,
      category: p.category, image: p.image || '',
    });
    setShowForm(true);
    requestAnimationFrame(() => {
      document.getElementById(`project-${eid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [searchParams, items]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      setForm(f => ({ ...f, image: url }));
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.title || !form.description) { toast.error('Title and description required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.projects.update(editing.id, form);
        toast.success('Updated');
      } else {
        await api.projects.create(form);
        toast.success('Created');
      }
      setShowForm(false);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try { await api.projects.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const statusColor = (s: string) => {
    if (s === 'Completed') return 'bg-green-100 text-green-700';
    if (s === 'In Progress') return 'bg-blue-100 text-blue-700';
    if (s === 'On Hold') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ghana-green" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">{items.length} total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-xl text-sm font-medium hover:bg-ghana-green/90">
          <Plus size={16} /> Add New
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit' : 'New'} Project</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                  <input type="number" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="GHS 500,000" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
                <input value={form.contractor} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <p className="text-[11px] text-gray-500 mb-2">Uploads are stored on this server under <code className="text-gray-600">/uploads</code> (no external storage).</p>
                {form.image ? (
                  <div className="mb-3 relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video max-h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(form.image)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="/uploads/… or full image URL" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
                  <label className="flex items-center px-3 py-2.5 rounded-xl border border-gray-200 text-sm cursor-pointer hover:bg-gray-50 shrink-0">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium bg-ghana-green text-white hover:bg-ghana-green/90 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {items.map(item => (
          <div id={`project-${item.id}`} key={item.id} className="p-4 flex items-start gap-4 scroll-mt-24">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
              {item.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={mediaUrl(item.image)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 text-center px-1">No image</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(item.status)}`}>{item.status}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-[200px] bg-gray-100 rounded-full h-1.5">
                  <div className="bg-ghana-green h-1.5 rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
                <span className="text-xs font-medium text-ghana-green">{item.progress}%</span>
                <span className="text-[10px] text-gray-400">{item.budget}</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{item.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-ghana-green"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-8 text-center text-sm text-gray-400">No projects yet</p>}
      </div>
    </div>
  );
}

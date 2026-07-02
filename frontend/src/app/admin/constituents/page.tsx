'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Trash2, Search, Plus, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Constituent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  community: string;
  age: number;
  gender: string;
  occupation: string;
  registeredAt: string;
}

const communities = [
  'Abokobi', 'Agbogba', 'Dome', 'Pantang', 'Haatso', 'Kwabenya',
  'Ashongman', 'Taifa', 'Sesemi', 'Boi', 'Other',
];

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  community: '',
  age: '',
  gender: '',
  occupation: '',
};

export default function AdminConstituentsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    api.constituents.getAll()
      .then(data => setItems(data as Constituent[]))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(decodeURIComponent(q));
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this constituent?')) return;
    try { await api.constituents.delete(id); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.community || !form.gender) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await api.constituents.register(form);
      toast.success('Constituent added');
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add constituent';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.community.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-npp-blue" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-npp-blue flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Constituents</h1>
            <p className="text-sm text-gray-500">{items.length} registered</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-npp-blue text-white text-sm font-semibold hover:bg-npp-blue-dark transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Constituent
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, community, or phone..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden md:table-cell">Community</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden lg:table-cell">Gender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden lg:table-cell">Occupation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden md:table-cell">Registered</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-npp-blue/10 flex items-center justify-center text-npp-blue font-bold text-[10px]">{item.fullName.charAt(0)}</div>
                      <span className="font-medium text-gray-900">{item.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{item.community}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{item.gender}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{item.occupation || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{item.registeredAt}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-400">
            {search ? 'No constituents match your search' : 'No constituents yet. Add one to get started.'}
          </p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Add Constituent</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                  placeholder="Full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                    placeholder="0241234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Community *</label>
                  <select
                    value={form.community}
                    onChange={e => setForm(f => ({ ...f, community: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-npp-blue outline-none"
                  >
                    <option value="">Select community</option>
                    {communities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-npp-blue outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    min={18}
                    max={120}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Occupation</label>
                  <input
                    value={form.occupation}
                    onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-npp-blue text-white text-sm font-semibold hover:bg-npp-blue-dark disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Add Constituent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

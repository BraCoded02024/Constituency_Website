'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Volunteer {
  id: string;
  fullName?: string;
  name?: string;
  phone: string;
  email?: string;
  community?: string;
  skills?: string;
  registeredAt: string;
}

export default function AdminVolunteersPage() {
  const [items, setItems] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    api.volunteers.getAll()
      .then(data => setItems(data as Volunteer[]))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this volunteer?')) return;
    try { await api.volunteers.delete(id); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  const getName = (v: Volunteer) => v.fullName || v.name || 'Unknown';

  const filtered = items.filter(v => {
    const name = getName(v).toLowerCase();
    return name.includes(search.toLowerCase()) || v.phone.includes(search);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ghana-green" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900">Volunteers</h1><p className="text-sm text-gray-500">{items.length} registered</p></div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden md:table-cell">Registered</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{getName(item)}</td>
                  <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{item.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{item.registeredAt}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-400">No volunteers found</p>}
      </div>
    </div>
  );
}

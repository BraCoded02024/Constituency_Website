'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Trash2, Search } from 'lucide-react';
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

export default function AdminConstituentsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = items.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.community.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ghana-green" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900">Constituents</h1><p className="text-sm text-gray-500">{items.length} registered</p></div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, community, or phone..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
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
                      <div className="w-7 h-7 rounded-full bg-ghana-green/10 flex items-center justify-center text-ghana-green font-bold text-[10px]">{item.fullName.charAt(0)}</div>
                      <span className="font-medium text-gray-900">{item.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{item.community}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{item.gender}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{item.occupation}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{item.registeredAt}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-400">No constituents found</p>}
      </div>
    </div>
  );
}

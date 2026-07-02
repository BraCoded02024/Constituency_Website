'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  UserCog, Plus, Search, Edit2, Trash2, X, Loader2, Shield, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ALL_PRIVILEGES,
  PRIVILEGE_LABELS,
  type AdminUser,
  type Privilege,
  isSuperAdmin,
} from '@/lib/permissions';

interface StaffMember extends AdminUser {
  created_at?: string;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff' as 'staff' | 'super_admin',
  privileges: [] as Privilege[],
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.staff.getAll();
      setStaff(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    load();
  }, []);

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role === 'super_admin' ? 'super_admin' : 'staff',
      privileges: [...(member.privileges || [])],
    });
    setShowForm(true);
  };

  const togglePrivilege = (priv: Privilege) => {
    setForm((f) => ({
      ...f,
      privileges: f.privileges.includes(priv)
        ? f.privileges.filter((p) => p !== priv)
        : [...f.privileges, priv],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || (!editId && !form.password)) {
      toast.error('Name, email, and password are required');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        privileges: form.role === 'super_admin' ? ALL_PRIVILEGES : form.privileges,
      };
      if (form.password) payload.password = form.password;

      if (editId) {
        await api.staff.update(editId, payload);
        toast.success('Staff member updated');
      } else {
        await api.staff.create(payload);
        toast.success('Staff member created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate ${name}? They will no longer be able to sign in.`)) return;
    try {
      await api.staff.deactivate(id);
      toast.success('Staff member deactivated');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate');
    }
  };

  const canManageSuperAdmin = isSuperAdmin(currentUser?.role || '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="text-npp-blue" size={26} />
            Staff & Roles
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create staff accounts and assign module privileges.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-npp-blue text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-npp-blue-dark transition-colors"
        >
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue focus:ring-2 focus:ring-npp-blue/20 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-npp-blue" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Privileges</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">{member.email}</td>
                    <td className="px-4 py-3">
                      {member.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-npp-red bg-npp-red/10 px-2 py-1 rounded-lg">
                          <Shield size={12} /> Super Admin
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">Staff</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {member.role === 'super_admin'
                          ? 'All modules'
                          : `${member.privileges?.length || 0} modules`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${member.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {member.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(member)}
                          className="p-2 text-gray-400 hover:text-npp-blue rounded-lg hover:bg-npp-blue/5"
                          aria-label={`Edit ${member.name}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        {member.role !== 'super_admin' && member.is_active !== false && (
                          <button
                            onClick={() => handleDeactivate(member.id, member.name)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                            aria-label={`Deactivate ${member.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-sm">No staff members found.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg">{editId ? 'Edit Staff' : 'Add Staff Member'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {editId ? 'New Password (leave blank to keep)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                  required={!editId}
                  minLength={6}
                />
              </div>
              {canManageSuperAdmin && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as 'staff' | 'super_admin' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue outline-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              )}
              {form.role === 'staff' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Module Privileges</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {ALL_PRIVILEGES.map((priv) => {
                      const selected = form.privileges.includes(priv);
                      return (
                        <button
                          key={priv}
                          type="button"
                          onClick={() => togglePrivilege(priv)}
                          className={`flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                            selected
                              ? 'border-npp-blue bg-npp-blue/10 text-npp-blue font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${selected ? 'bg-npp-blue text-white' : 'bg-gray-100'}`}>
                            {selected && <Check size={10} />}
                          </span>
                          {PRIVILEGE_LABELS[priv]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Assign only the modules this staff member should access.</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-npp-blue text-white text-sm font-semibold hover:bg-npp-blue-dark disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editId ? 'Save Changes' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

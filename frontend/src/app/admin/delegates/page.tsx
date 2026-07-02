'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  UserCheck, Upload, Plus, Search, Edit2, Trash2, X,
  Loader2, FileSpreadsheet, CheckCircle, AlertCircle, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Delegate {
  id: string;
  fullName: string;
  address: string | null;
  gender: string | null;
  ghanaCard: string | null;
  votersId: string | null;
  pollingStationName: string | null;
  pollingStationCode: string | null;
  phone: string | null;
  email: string | null;
  community: string | null;
  status: string;
  registeredAt: string;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended'];

const emptyForm = {
  fullName: '',
  address: '',
  gender: '',
  ghanaCard: '',
  votersId: '',
  pollingStationName: '',
  pollingStationCode: '',
  phone: '',
  email: '',
  community: '',
  status: 'Active',
};

interface FieldErrors {
  ghanaCard?: string;
  votersId?: string;
  pollingStationCode?: string;
  phone?: string;
  email?: string;
}

const GHANA_CARD_RE = /^GHA-\d{9}-\d$/;
const VOTERS_ID_RE = /^\d{10}$/;
const POLLING_CODE_RE = /^[A-Z0-9]{4,12}$/i;
const PHONE_RE = /^0[2-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(form: typeof emptyForm): FieldErrors {
  const errors: FieldErrors = {};
  if (form.ghanaCard && !GHANA_CARD_RE.test(form.ghanaCard))
    errors.ghanaCard = 'Format: GHA-XXXXXXXXX-X';
  if (form.votersId && !VOTERS_ID_RE.test(form.votersId))
    errors.votersId = 'Must be exactly 10 digits';
  if (form.pollingStationCode && !POLLING_CODE_RE.test(form.pollingStationCode))
    errors.pollingStationCode = '4–12 alphanumeric characters';
  if (form.phone && !PHONE_RE.test(form.phone.replace(/[\s-]/g, '')))
    errors.phone = 'e.g. 0241234567';
  if (form.email && !EMAIL_RE.test(form.email))
    errors.email = 'Invalid email';
  return errors;
}

export default function DelegatesPage() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDelegates = useCallback(() => {
    setLoading(true);
    api.delegates.getAll()
      .then(data => setDelegates(data as Delegate[]))
      .catch(() => toast.error('Failed to load delegates'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDelegates(); }, [fetchDelegates]);

  const filtered = delegates.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.fullName.toLowerCase().includes(q) ||
      (d.address && d.address.toLowerCase().includes(q)) ||
      (d.ghanaCard && d.ghanaCard.toLowerCase().includes(q)) ||
      (d.votersId && d.votersId.toLowerCase().includes(q)) ||
      (d.pollingStationName && d.pollingStationName.toLowerCase().includes(q)) ||
      (d.pollingStationCode && d.pollingStationCode.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.community && d.community.toLowerCase().includes(q));
    const matchGender = !filterGender || d.gender === filterGender;
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchGender && matchStatus;
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setShowForm(true);
  };

  const openEdit = (d: Delegate) => {
    setEditId(d.id);
    setForm({
      fullName: d.fullName,
      address: d.address || '',
      gender: d.gender || '',
      ghanaCard: d.ghanaCard || '',
      votersId: d.votersId || '',
      pollingStationName: d.pollingStationName || '',
      pollingStationCode: d.pollingStationCode || '',
      phone: d.phone || '',
      email: d.email || '',
      community: d.community || '',
      status: d.status,
    });
    setFieldErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) return toast.error('Full name is required');

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.delegates.update(editId, form);
        toast.success('Delegate updated');
      } else {
        await api.delegates.create(form);
        toast.success('Delegate added');
      }
      setShowForm(false);
      fetchDelegates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete delegate "${name}"?`)) return;
    try {
      await api.delegates.delete(id);
      toast.success('Delegate deleted');
      fetchDelegates();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleFileImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.delegates.import(file);
      setImportResult(result);
      toast.success(`${result.imported} delegates imported`);
      fetchDelegates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const fieldClass = (key: keyof FieldErrors) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm ${
      fieldErrors[key] ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-npp-blue flex items-center justify-center">
            <UserCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Delegate Management</h1>
            <p className="text-xs text-gray-500">{delegates.length} total delegates</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImport(true); setImportResult(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-npp-blue text-white text-sm font-semibold hover:bg-npp-blue-dark transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Delegate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, address, Ghana card, voter's ID, station..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-npp-blue focus:ring-2 focus:ring-npp-blue/20"
          />
        </div>
        <div className="relative">
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-npp-blue"
          >
            <option value="">All Genders</option>
            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-npp-blue"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-npp-blue" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UserCheck size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">{search || filterGender || filterStatus ? 'No delegates match your filters' : 'No delegates yet. Add or import delegates to get started.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden md:table-cell">Polling Station</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden lg:table-cell">PS Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Gender</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden lg:table-cell">Voter&apos;s ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden xl:table-cell">Ghana Card</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden xl:table-cell">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-npp-blue/10 flex items-center justify-center text-npp-blue font-bold text-xs shrink-0">
                          {d.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{d.fullName}</p>
                          <p className="text-[10px] text-gray-400 md:hidden truncate">{d.pollingStationName || d.address || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell truncate max-w-[180px]">{d.pollingStationName || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell font-mono text-xs">{d.pollingStationCode || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">{d.gender || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell font-mono text-xs">{d.votersId || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 hidden xl:table-cell font-mono text-xs">{d.ghanaCard || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 hidden xl:table-cell">{d.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        d.status === 'Active' ? 'bg-green-100 text-green-700' :
                        d.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-npp-blue hover:bg-npp-blue/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.fullName)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} of {delegates.length} delegates
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">{editId ? 'Edit Delegate' : 'Add Delegate'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  placeholder="Enter full name"
                />
              </div>

              {/* Gender & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Polling Station Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Polling Station Name</label>
                <input
                  type="text"
                  value={form.pollingStationName}
                  onChange={e => setForm(f => ({ ...f, pollingStationName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  placeholder="e.g. Abokobi M/A Primary School"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Text — name of the polling station</p>
              </div>

              {/* Polling Station Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Polling Station Code</label>
                <input
                  type="text"
                  value={form.pollingStationCode}
                  onChange={e => {
                    const v = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
                    setForm(f => ({ ...f, pollingStationCode: v }));
                    if (v && !POLLING_CODE_RE.test(v)) setFieldErrors(fe => ({ ...fe, pollingStationCode: '4–12 alphanumeric characters' }));
                    else setFieldErrors(fe => { const n = { ...fe }; delete n.pollingStationCode; return n; });
                  }}
                  className={fieldClass('pollingStationCode')}
                  placeholder="e.g. A090101"
                  maxLength={12}
                />
                {fieldErrors.pollingStationCode
                  ? <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.pollingStationCode}</p>
                  : <p className="text-[10px] text-gray-400 mt-0.5">Alphanumeric, 4–12 characters</p>}
              </div>

              {/* Voter's ID & Ghana Card */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Voter&apos;s ID</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.votersId}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm(f => ({ ...f, votersId: v }));
                      if (v && !VOTERS_ID_RE.test(v)) setFieldErrors(fe => ({ ...fe, votersId: 'Must be 10 digits' }));
                      else setFieldErrors(fe => { const n = { ...fe }; delete n.votersId; return n; });
                    }}
                    className={fieldClass('votersId')}
                    placeholder="0000000000"
                    maxLength={10}
                  />
                  {fieldErrors.votersId
                    ? <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.votersId}</p>
                    : <p className="text-[10px] text-gray-400 mt-0.5">Exactly 10 digits</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ghana Card</label>
                  <input
                    type="text"
                    value={form.ghanaCard}
                    onChange={e => {
                      let v = e.target.value.toUpperCase();
                      v = v.replace(/[^A-Z0-9-]/g, '').slice(0, 15);
                      setForm(f => ({ ...f, ghanaCard: v }));
                      if (v && !GHANA_CARD_RE.test(v)) setFieldErrors(fe => ({ ...fe, ghanaCard: 'GHA-XXXXXXXXX-X' }));
                      else setFieldErrors(fe => { const n = { ...fe }; delete n.ghanaCard; return n; });
                    }}
                    className={`${fieldClass('ghanaCard')} font-mono`}
                    placeholder="GHA-XXXXXXXXX-X"
                    maxLength={15}
                  />
                  {fieldErrors.ghanaCard
                    ? <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.ghanaCard}</p>
                    : <p className="text-[10px] text-gray-400 mt-0.5">Format: GHA-123456789-0</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  placeholder="Residential address"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input
                    type="text"
                    inputMode="tel"
                    value={form.phone}
                    onChange={e => {
                      const v = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                      setForm(f => ({ ...f, phone: v }));
                      if (v && !PHONE_RE.test(v)) setFieldErrors(fe => ({ ...fe, phone: 'e.g. 0241234567' }));
                      else setFieldErrors(fe => { const n = { ...fe }; delete n.phone; return n; });
                    }}
                    className={fieldClass('phone')}
                    placeholder="0XX XXX XXXX"
                    maxLength={10}
                  />
                  {fieldErrors.phone && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => {
                      setForm(f => ({ ...f, email: e.target.value }));
                      if (e.target.value && !EMAIL_RE.test(e.target.value)) setFieldErrors(fe => ({ ...fe, email: 'Invalid email' }));
                      else setFieldErrors(fe => { const n = { ...fe }; delete n.email; return n; });
                    }}
                    className={fieldClass('email')}
                    placeholder="email@example.com"
                  />
                  {fieldErrors.email && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.email}</p>}
                </div>
              </div>

              {/* Community */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Community</label>
                <input
                  type="text"
                  value={form.community}
                  onChange={e => setForm(f => ({ ...f, community: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  placeholder="Community / Town"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(fieldErrors).length > 0}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-npp-blue text-white hover:bg-npp-blue-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editId ? 'Update' : 'Add Delegate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-npp-blue" />
                <h3 className="font-bold text-lg text-gray-900">Import Delegates</h3>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Upload an Excel (.xlsx, .xls) or CSV file with delegate data. The system will automatically detect columns like:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Name / Full Name</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Address / Location</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Gender / Sex</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Ghana Card No.</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Voter&apos;s ID</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Polling Station Name</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Polling Station Code</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Phone / Mobile</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600 font-medium">Community / Town</div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileImport(file);
                  e.target.value = '';
                }}
              />

              {importing ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 size={32} className="animate-spin text-npp-blue" />
                  <p className="text-sm text-gray-500">Importing delegates...</p>
                </div>
              ) : importResult ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                    <CheckCircle size={16} />
                    Import Complete
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
                      <p className="text-[10px] text-green-600 font-medium">Imported</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                      <p className="text-[10px] text-yellow-600 font-medium">Skipped</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600">{importResult.total}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Total Rows</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Import Another File
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 flex flex-col items-center gap-3 text-gray-500 hover:border-npp-blue hover:text-npp-blue transition-colors group"
                >
                  <Upload size={32} className="group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">Click to select file</p>
                    <p className="text-[11px] text-gray-400">.xlsx, .xls, or .csv</p>
                  </div>
                </button>
              )}

              <div className="flex items-start gap-2 text-[11px] text-gray-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>Rows without a name will be skipped. Duplicate entries are not checked — review data after import.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

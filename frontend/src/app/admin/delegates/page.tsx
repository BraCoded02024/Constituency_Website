'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  GENDER_OPTIONS,
  STATUS_OPTIONS,
  SURVEY_STATUS_OPTIONS,
  type Delegate,
  type DelegatesPageResult,
  type ElectoralArea,
  type PollingStation,
  type DelegateCategory,
} from '@/lib/delegateTypes';
import {
  UserCheck, Upload, Plus, Search, Trash2, Loader2, FileSpreadsheet,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

export default function DelegatesPage() {
  const [result, setResult] = useState<DelegatesPageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSurvey, setFilterSurvey] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [areas, setAreas] = useState<ElectoralArea[]>([]);
  const [stations, setStations] = useState<PollingStation[]>([]);
  const [categories, setCategories] = useState<DelegateCategory[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    total: number;
    failed?: { row: number; field: string; reason: string }[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useDeferredEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useDeferredEffect(() => {
    api.electoralAreas.getAll({ active: true }).then((d) => setAreas(d as ElectoralArea[])).catch(() => {});
    api.delegateCategories.getAll({ active: true }).then((d) => setCategories(d as DelegateCategory[])).catch(() => {});
  }, []);

  useDeferredEffect(() => {
    if (!filterArea) {
      setStations([]);
      setFilterStation('');
      return;
    }
    let cancelled = false;
    api.pollingStations.getAll({ electoralAreaId: filterArea, active: true })
      .then((d) => { if (!cancelled) setStations(d as PollingStation[]); })
      .catch(() => { if (!cancelled) setStations([]); });
    setFilterStation('');
    return () => { cancelled = true; };
  }, [filterArea]);

  const load = useCallback(() => {
    setLoading(true);
    api.delegates.getAll({
      search: debouncedSearch || undefined,
      electoralAreaId: filterArea || undefined,
      pollingStationId: filterStation || undefined,
      categoryId: filterCategory || undefined,
      status: filterStatus || undefined,
      gender: filterGender || undefined,
      currentStatus: filterSurvey || undefined,
      sort,
      page,
      limit: 25,
    })
      .then((data) => setResult(data as DelegatesPageResult))
      .catch(() => toast.error('Failed to load delegates'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filterArea, filterStation, filterCategory, filterStatus, filterGender, filterSurvey, sort, page]);

  useDeferredEffect(() => { load(); }, [load]);
  useDeferredEffect(() => { setPage(1); }, [debouncedSearch, filterArea, filterStation, filterCategory, filterStatus, filterGender, filterSurvey, sort]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delegate? Survey history will also be removed.')) return;
    try {
      await api.delegates.delete(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await api.delegates.import(file);
      setImportResult(res);
      toast.success(`${res.imported} imported, ${res.skipped} skipped`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const selectCls = 'px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="text-npp-blue" size={22} /> Delegates
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {result ? `${result.total} total` : 'Registry'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setShowImport(true); setImportResult(null); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload size={16} /> Import
          </button>
          <Link
            href="/admin/delegates/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium hover:bg-npp-blue/90"
          >
            <Plus size={16} /> Add Delegate
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, name, phone, Ghana Card, voter ID, community, station…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-npp-blue/30"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <select className={selectCls} value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
            <option value="">All areas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className={selectCls} value={filterStation} onChange={(e) => setFilterStation(e.target.value)} disabled={!filterArea}>
            <option value="">All stations</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={selectCls} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={selectCls} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={selectCls} value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
            <option value="">All genders</option>
            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className={selectCls} value={filterSurvey} onChange={(e) => setFilterSurvey(e.target.value)}>
            <option value="">All survey states</option>
            {SURVEY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="Unsurveyed">Unsurveyed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort</span>
          <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>
      ) : !result || result.data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">
          No delegates found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden md:table-cell">Area / Station</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Position</th>
                  <th className="px-4 py-3">Survey</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.data.map((d: Delegate) => (
                  <tr key={d.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs text-npp-blue">{d.delegateCode || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {d.fullName}
                        {d.isFlagged && (
                          <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700">Flagged</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{d.phone || d.community || ''}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      <div>{d.electoralAreaName || '—'}</div>
                      <div className="text-xs text-gray-400">{d.pollingStationLabel || d.pollingStationName || ''}</div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                      <div>{d.position || d.categoryName || '—'}</div>
                      <div className="text-xs text-gray-400">{d.level || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.currentStatus === 'Supporting' ? 'bg-green-50 text-green-700'
                          : d.currentStatus === 'Not Supporting' ? 'bg-red-50 text-red-700'
                            : d.currentStatus === 'Floating' ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                      }`}>
                        {d.currentStatus || 'Unsurveyed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.status}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Link href={`/admin/delegates/${d.id}`} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-npp-blue" title="View">
                          <Eye size={16} />
                        </Link>
                        <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>Page {result.page} of {result.totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-npp-blue" /> Import Delegates
              </h2>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <p className="text-xs text-gray-500">
              CSV/Excel with Name column. Optional: phone, Ghana Card, voter ID, electoral area, polling station, category, status.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
              }}
            />
            {importing && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="animate-spin" size={16} /> Importing…
              </div>
            )}
            {importResult && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
                  {importResult.imported} imported · {importResult.skipped} skipped · {importResult.total} total
                </div>
                {importResult.failed && importResult.failed.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-red-100 bg-red-50 p-3 space-y-1">
                    <div className="flex items-center gap-1 text-red-700 font-medium text-xs">
                      <AlertCircle size={14} /> Failed rows
                    </div>
                    {importResult.failed.map((f, i) => (
                      <p key={i} className="text-xs text-red-700">Row {f.row} · {f.field}: {f.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

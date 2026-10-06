'use client';

import { useCallback, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { ElectoralArea, PollingStation, DelegateCategory } from '@/lib/delegateTypes';
import { GENDER_OPTIONS, STATUS_OPTIONS, SURVEY_STATUS_OPTIONS } from '@/lib/delegateTypes';
import {
  FileBarChart, Loader2, Download, Printer, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

interface ReportSummary {
  total: number;
  surveyed: number;
  notSurveyed: number;
  supporting: number;
  notSupporting: number;
  floating: number;
  supportingPct: number;
  notSupportingPct: number;
  floatingPct: number;
  surveyedPct: number;
}

interface ReportGroup extends ReportSummary {
  id: string | null;
  name: string;
}

interface ReportRecord {
  id: string;
  delegateCode: string | null;
  fullName: string;
  phone: string | null;
  community: string | null;
  electoralAreaName: string | null;
  pollingStationName: string | null;
  categoryName: string | null;
  status: string | null;
  confidence: string | null;
  officerName: string | null;
  surveyAt: string | null;
}

interface ReportPayload {
  mode: 'snapshot' | 'historical';
  from: string | null;
  to: string | null;
  summary: ReportSummary;
  byElectoralArea: ReportGroup[];
  byPollingStation: ReportGroup[];
  bySurveyOfficer: ReportGroup[];
  byCategory: ReportGroup[];
  records: ReportRecord[];
}

function GroupTable({ title, rows }: { title: string; rows: ReportGroup[] }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:break-inside-avoid">
      <div className="px-4 py-3 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-gray-500">No rows for this grouping.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Surveyed</th>
                <th className="px-4 py-2">Supporting</th>
                <th className="px-4 py-2">Not Supporting</th>
                <th className="px-4 py-2">Floating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={`${r.id}-${r.name}`}>
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2">{r.total}</td>
                  <td className="px-4 py-2">{r.surveyed} ({r.surveyedPct}%)</td>
                  <td className="px-4 py-2 text-green-700">{r.supporting} ({r.supportingPct}%)</td>
                  <td className="px-4 py-2 text-red-700">{r.notSupporting} ({r.notSupportingPct}%)</td>
                  <td className="px-4 py-2 text-amber-700">{r.floating} ({r.floatingPct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function DelegateReportsPage() {
  const [areas, setAreas] = useState<ElectoralArea[]>([]);
  const [stations, setStations] = useState<PollingStation[]>([]);
  const [categories, setCategories] = useState<DelegateCategory[]>([]);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    electoralAreaId: '',
    pollingStationId: '',
    categoryId: '',
    status: '',
    gender: '',
    currentStatus: '',
    from: '',
    to: '',
    search: '',
  });

  useDeferredEffect(() => {
    api.electoralAreas.getAll({ active: true }).then((d) => setAreas(d as ElectoralArea[])).catch(() => {});
    api.delegateCategories.getAll().then((d) => setCategories(d as DelegateCategory[])).catch(() => {});
  }, []);

  useDeferredEffect(() => {
    if (!filters.electoralAreaId) {
      setStations([]);
      return;
    }
    let cancelled = false;
    api.pollingStations.getAll({ electoralAreaId: filters.electoralAreaId })
      .then((d) => { if (!cancelled) setStations(d as PollingStation[]); })
      .catch(() => { if (!cancelled) setStations([]); });
    return () => { cancelled = true; };
  }, [filters.electoralAreaId]);

  const queryParams = useMemo(() => {
    const p: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v) p[k] = v;
    }
    return p;
  }, [filters]);

  const load = useCallback(() => {
    setLoading(true);
    api.delegateReports.get(queryParams)
      .then((d) => setReport(d as ReportPayload))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [queryParams]);

  useDeferredEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    try {
      const url = api.delegateReports.exportCsvUrl(queryParams);
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `delegate-report-${report?.mode || 'export'}.csv`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success('CSV downloaded');
    } catch {
      toast.error('CSV export failed');
    }
  };

  const selectCls = 'px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileBarChart className="text-npp-blue" size={22} /> Delegate Reports
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Snapshot uses current delegate state. Date range uses latest survey in that period (historical).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExport} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm">
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 print:hidden">
        <input
          className={selectCls}
          placeholder="Search name / code / phone"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select className={selectCls} value={filters.electoralAreaId} onChange={(e) => setFilters({ ...filters, electoralAreaId: e.target.value, pollingStationId: '' })}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className={selectCls} value={filters.pollingStationId} onChange={(e) => setFilters({ ...filters, pollingStationId: e.target.value })} disabled={!filters.electoralAreaId}>
          <option value="">All stations</option>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={selectCls} value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={selectCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Registry status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectCls} value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
          <option value="">Gender</option>
          {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={selectCls} value={filters.currentStatus} onChange={(e) => setFilters({ ...filters, currentStatus: e.target.value })}>
          <option value="">Survey status (snapshot)</option>
          {SURVEY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value="Unsurveyed">Unsurveyed</option>
        </select>
        <div className="flex gap-2 col-span-2 md:col-span-1">
          <input type="date" className={selectCls + ' w-full'} value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} title="From" />
          <input type="date" className={selectCls + ' w-full'} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} title="To" />
        </div>
      </div>

      {loading && !report ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>
      ) : !report ? (
        <div className="text-center py-16 text-sm text-gray-500">No report data.</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 print:border-0">
            <p className="text-xs text-gray-500 mb-3">
              Mode: <strong className="text-gray-800">{report.mode}</strong>
              {report.from || report.to ? ` · ${report.from || '…'} → ${report.to || '…'}` : ' · current snapshot'}
              {loading ? ' · refreshing…' : ''}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{report.summary.total}</p></div>
              <div><p className="text-xs text-gray-500">Surveyed</p><p className="text-lg font-bold">{report.summary.surveyed}</p></div>
              <div><p className="text-xs text-gray-500">Not Surveyed</p><p className="text-lg font-bold">{report.summary.notSurveyed}</p></div>
              <div><p className="text-xs text-gray-500">Supporting</p><p className="text-lg font-bold text-green-700">{report.summary.supporting}</p></div>
              <div><p className="text-xs text-gray-500">Not Supporting</p><p className="text-lg font-bold text-red-700">{report.summary.notSupporting}</p></div>
              <div><p className="text-xs text-gray-500">Floating</p><p className="text-lg font-bold text-amber-700">{report.summary.floating}</p></div>
            </div>
          </div>

          <GroupTable title="By Electoral Area" rows={report.byElectoralArea} />
          <GroupTable title="By Polling Station" rows={report.byPollingStation} />
          <GroupTable title="By Survey Officer" rows={report.bySurveyOfficer} />
          <GroupTable title="By Category" rows={report.byCategory} />

          <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:break-inside-avoid">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Detailed records ({report.records.length})</h2>
            </div>
            {report.records.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">No records match the current filters.</p>
            ) : (
              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Area</th>
                      <th className="px-3 py-2">Station</th>
                      <th className="px-3 py-2">Survey</th>
                      <th className="px-3 py-2">Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.records.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-mono text-xs">{r.delegateCode || '—'}</td>
                        <td className="px-3 py-2 font-medium">{r.fullName}</td>
                        <td className="px-3 py-2">{r.electoralAreaName || '—'}</td>
                        <td className="px-3 py-2">{r.pollingStationName || '—'}</td>
                        <td className="px-3 py-2">{r.status || 'Unsurveyed'}{r.confidence ? ` · ${r.confidence}` : ''}</td>
                        <td className="px-3 py-2 text-gray-500">{r.officerName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <style>{`
        @media print {
          aside, header { display: none !important; }
          main { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

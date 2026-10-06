'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import {
  GENDER_OPTIONS,
  SURVEY_STATUS_OPTIONS,
  type DelegateCategory,
  type ElectoralArea,
  type PollingStation,
} from '@/lib/delegateTypes';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

interface SmsRecord {
  id: string;
  delegateId: string | null;
  delegateName: string | null;
  phone: string;
  message: string;
  status: string;
  error?: string | null;
  createdAt: string;
}

interface AudienceRow {
  id: string;
  fullName: string;
  delegateCode?: string | null;
  phone?: string | null;
  position?: string | null;
  level?: string | null;
  categoryName?: string | null;
  electoralAreaName?: string | null;
  pollingStationLabel?: string | null;
  currentStatus?: string | null;
  reachable: boolean;
}

interface AudiencePage {
  total: number;
  withPhone: number;
  page: number;
  totalPages: number;
  data: AudienceRow[];
}

const selectCls = 'w-full min-w-0 max-w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white';

export default function SmsPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [rows, setRows] = useState<SmsRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [audience, setAudience] = useState<AudiencePage | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [areas, setAreas] = useState<ElectoralArea[]>([]);
  const [stations, setStations] = useState<PollingStation[]>([]);
  const [categories, setCategories] = useState<DelegateCategory[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lookup, setLookup] = useState('');
  const [lookupResults, setLookupResults] = useState<AudienceRow[]>([]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [named, setNamed] = useState<Record<string, AudienceRow>>({});
  const [areaId, setAreaId] = useState('');
  const [stationId, setStationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [gender, setGender] = useState('');
  const [level, setLevel] = useState('');
  const [survey, setSurvey] = useState('');
  const [flagged, setFlagged] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectingAll, setSelectingAll] = useState(false);
  const [message, setMessage] = useState('Hello {name}, this is a message from NPP Sunyani East. ');
  const [sending, setSending] = useState(false);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    electoralAreaId: areaId || undefined,
    pollingStationId: stationId || undefined,
    categoryId: categoryId || undefined,
    gender: gender || undefined,
    level: level || undefined,
    currentStatus: survey || undefined,
    flagged: flagged || undefined,
  }), [debouncedSearch, areaId, stationId, categoryId, gender, level, survey, flagged]);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    Promise.all([api.sms.status(), api.sms.list()])
      .then(([status, messages]) => {
        setConfigured((status as { configured: boolean }).configured);
        setRows(messages as SmsRecord[]);
      })
      .catch(() => toast.error('Failed to load SMS history'))
      .finally(() => setHistoryLoading(false));
  }, []);

  const loadAudience = useCallback(() => {
    setListLoading(true);
    api.sms.audience({ ...filters, page, limit: 25 })
      .then((data) => setAudience(data as AudiencePage))
      .catch(() => toast.error('Failed to load delegates'))
      .finally(() => setListLoading(false));
  }, [filters, page]);

  useDeferredEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useDeferredEffect(() => {
    const query = lookup.trim();
    if (query.length < 2) {
      setLookupResults([]);
      setLookupLoading(false);
      return;
    }
    let cancelled = false;
    setLookupLoading(true);
    const t = setTimeout(() => {
      api.sms.audience({ search: query, limit: 8 })
        .then((data) => {
          if (!cancelled) setLookupResults((data as AudiencePage).data);
        })
        .catch(() => {
          if (!cancelled) setLookupResults([]);
        })
        .finally(() => {
          if (!cancelled) setLookupLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [lookup]);

  useDeferredEffect(() => {
    api.electoralAreas.getAll({ active: true }).then((d) => setAreas(d as ElectoralArea[])).catch(() => {});
    api.delegateCategories.getAll({ active: true }).then((d) => setCategories(d as DelegateCategory[])).catch(() => {});
    loadHistory();
  }, [loadHistory]);

  useDeferredEffect(() => {
    if (!areaId) {
      setStations([]);
      setStationId('');
      return;
    }
    let cancelled = false;
    api.pollingStations.getAll({ electoralAreaId: areaId, active: true })
      .then((d) => { if (!cancelled) setStations(d as PollingStation[]); })
      .catch(() => { if (!cancelled) setStations([]); });
    setStationId('');
    return () => { cancelled = true; };
  }, [areaId]);

  useDeferredEffect(() => { setPage(1); setSelected(new Set()); }, [filters]);
  useDeferredEffect(() => { loadAudience(); }, [loadAudience]);

  const pageReachable = audience?.data.filter((row) => row.reachable) || [];
  const pageAllSelected = pageReachable.length > 0 && pageReachable.every((row) => selected.has(row.id));
  const personalized = message.includes('{name}');
  const overPersonalLimit = personalized && selected.size > 100;

  const addCandidate = (row: AudienceRow) => {
    if (!row.reachable) {
      toast.error(`${row.fullName} has no phone number that can receive SMS`);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(row.id);
      return next;
    });
    setNamed((prev) => ({ ...prev, [row.id]: row }));
    setLookup('');
    setLookupResults([]);
    setLookupOpen(false);
  };

  const picked = Object.values(named).filter((row) => selected.has(row.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageReachable.forEach((row) => next.delete(row.id));
      else pageReachable.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const selectMatching = async () => {
    setSelectingAll(true);
    try {
      const data = await api.sms.audience({ ...filters, idsOnly: 1 }) as { ids: string[]; withPhone: number };
      setSelected(new Set(data.ids));
      if (data.withPhone > data.ids.length) {
        toast.error('Only the first 2,000 people with a phone were selected');
      } else {
        toast.success(`${data.ids.length} people with a phone selected`);
      }
    } catch {
      toast.error('Could not select this group');
    } finally {
      setSelectingAll(false);
    }
  };

  const send = async () => {
    const text = message.trim();
    if (!text) {
      toast.error('Write a message first');
      return;
    }
    if (selected.size === 0) {
      toast.error('Choose at least one delegate');
      return;
    }
    const label = selected.size === 1 ? '1 delegate' : `${selected.size} delegates`;
    if (!window.confirm(`Send this SMS to ${label}?`)) return;
    setSending(true);
    try {
      const result = await api.sms.send({ delegateIds: [...selected], message: text });
      const skipped = result.rejected?.length || 0;
      if (result.failedCount > 0) {
        toast.error(`${result.sentCount} sent, ${result.failedCount} failed${skipped ? `, ${skipped} skipped` : ''}`);
      } else {
        toast.success(`SMS sent to ${result.sentCount}${skipped ? `. ${skipped} skipped` : ''}`);
      }
      setSelected(new Set());
      loadHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SMS failed');
      loadHistory();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="text-npp-blue" size={22} /> SMS
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Search one candidate above, tick a few, or select a whole category, area, or station.
          {configured === false && ' Add ARKESEL_API_KEY and ARKESEL_SENDER_ID in backend/.env, then restart the API.'}
          {configured === true && ' Arkesel is connected.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <label className="block text-sm font-semibold text-gray-900" htmlFor="candidate-search">
          Find a candidate
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="candidate-search"
            value={lookup}
            onChange={(e) => {
              const value = e.target.value;
              setLookup(value);
              setLookupOpen(true);
              setLookupLoading(value.trim().length >= 2);
            }}
            onFocus={() => setLookupOpen(true)}
            onBlur={() => setTimeout(() => setLookupOpen(false), 150)}
            placeholder="Type a name, delegate code, or phone"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-npp-blue/30"
            autoComplete="off"
          />
          {lookupOpen && lookup.trim().length >= 2 && (
            <div className="absolute z-20 mt-1 w-full max-h-[40vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
              {lookupLoading ? (
                <p className="px-3 py-3 text-sm text-gray-500">Searching…</p>
              ) : lookupResults.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-500">No candidate matches that search.</p>
              ) : (
                <ul>
                  {lookupResults.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addCandidate(row)}
                        className="w-full text-left px-3 py-3 hover:bg-gray-50"
                      >
                        <span className="block text-sm font-medium text-gray-900 break-words">{row.fullName}</span>
                        <span className="block text-xs text-gray-500 break-words">
                          {row.delegateCode || '—'}
                          {row.categoryName || row.position ? ` · ${row.categoryName || row.position}` : ''}
                          {row.electoralAreaName ? ` · ${row.electoralAreaName}` : ''}
                          {row.phone ? ` · ${row.phone}` : ' · no phone'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {picked.map((row) => (
              <span key={row.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-npp-blue/10 text-npp-blue text-xs font-medium">
                {row.fullName}
                <button type="button" onClick={() => toggle(row.id)} aria-label={`Remove ${row.fullName}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, code, or area"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-npp-blue/30"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <select className={selectCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={selectCls} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">All electoral areas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className={selectCls} value={stationId} onChange={(e) => setStationId(e.target.value)} disabled={!areaId}>
            <option value="">All polling stations</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={selectCls} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All levels</option>
            <option value="Polling Station">Polling Station</option>
            <option value="Electoral Area">Electoral Area</option>
          </select>
          <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">All genders</option>
            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className={selectCls} value={survey} onChange={(e) => setSurvey(e.target.value)}>
            <option value="">All survey states</option>
            {SURVEY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="Unsurveyed">Unsurveyed</option>
          </select>
          <select className={selectCls} value={flagged} onChange={(e) => setFlagged(e.target.value)}>
            <option value="">Flagged or not</option>
            <option value="yes">Flagged only</option>
            <option value="no">Not flagged</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 text-xs text-gray-600 sm:flex-row sm:flex-wrap sm:items-center">
          <span>{audience ? `${audience.total} match · ${audience.withPhone} with a phone` : 'Loading recipients'}</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span className="font-medium text-gray-900">{selected.size} selected</span>
          <button
            type="button"
            onClick={selectMatching}
            disabled={selectingAll || !audience?.withPhone}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 disabled:opacity-40"
          >
            {selectingAll ? 'Selecting…' : 'Select everyone matching'}
          </button>
          {selected.size > 0 && (
            <button type="button" onClick={() => setSelected(new Set())} className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 text-gray-600">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {listLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>
        ) : !audience || audience.data.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">No delegates match these filters.</p>
        ) : (
          <>
            <ul className="md:hidden divide-y divide-gray-50">
              <li className="px-4 py-3 flex items-center gap-3 bg-gray-50">
                <input type="checkbox" className="h-5 w-5" checked={pageAllSelected} onChange={togglePage} aria-label="Select this page" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Select this page</span>
              </li>
              {audience.data.map((row) => (
                <li key={row.id} className={selected.has(row.id) ? 'bg-blue-50/50' : ''}>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0"
                      checked={selected.has(row.id)}
                      disabled={!row.reachable}
                      onChange={() => toggle(row.id)}
                      aria-label={`Select ${row.fullName}`}
                    />
                    <div className="min-w-0">
                      <Link href={`/admin/delegates/${row.id}`} className="font-medium text-npp-blue hover:underline break-words">
                        {row.fullName}
                      </Link>
                      <span className="block text-xs text-gray-500 break-words mt-0.5">
                        {row.delegateCode || '—'}
                        {row.phone ? ` · ${row.phone}` : ' · no phone'}
                        {!row.reachable && row.phone ? ' · cannot text this number' : ''}
                      </span>
                      <span className="block text-xs text-gray-500 break-words">
                        {row.categoryName || row.position || 'No category'}
                        {row.electoralAreaName ? ` · ${row.electoralAreaName}` : ''}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={pageAllSelected} onChange={togglePage} aria-label="Select this page" />
                    </th>
                    <th className="px-4 py-3">Delegate</th>
                    <th className="px-4 py-3 hidden md:table-cell">Category</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {audience.data.map((row) => (
                    <tr key={row.id} className={selected.has(row.id) ? 'bg-blue-50/50' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          disabled={!row.reachable}
                          onChange={() => toggle(row.id)}
                          aria-label={`Select ${row.fullName}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/delegates/${row.id}`} className="font-medium text-npp-blue hover:underline">
                          {row.fullName}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {row.delegateCode || '—'}
                          {row.phone ? ` · ${row.phone}` : ' · no phone'}
                          {!row.reachable && row.phone ? ' · cannot text this number' : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                        <div>{row.categoryName || row.position || '—'}</div>
                        <div className="text-xs text-gray-400">{row.level || ''}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                        <div>{row.electoralAreaName || '—'}</div>
                        <div className="text-xs text-gray-400">{row.pollingStationLabel || ''}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
              <span>Page {audience.page} of {audience.totalPages}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  type="button"
                  disabled={!audience || page >= audience.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Message</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={480}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-npp-blue/30"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            {message.trim().length}/480.
            {' '}Use {'{name}'} for the first name. That works for up to 100 people. Larger groups get the same text, so remove {'{name}'} first.
            {overPersonalLimit && ' This message uses {name} and more than 100 people are selected.'}
          </p>
          <button
            type="button"
            onClick={send}
            disabled={sending || selected.size === 0 || configured === false || overPersonalLimit}
            className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-npp-blue text-white text-sm font-medium disabled:opacity-50 shrink-0"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
            {selected.size > 0 ? `Send to ${selected.size}` : 'Send SMS'}
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-3 md:hidden">
        <button
          type="button"
          onClick={send}
          disabled={sending || selected.size === 0 || configured === false || overPersonalLimit}
          className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-npp-blue text-white text-sm font-medium disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
          {selected.size > 0 ? `Send to ${selected.size}` : 'Send SMS'}
        </button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Recent messages</h2>
        {historyLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-npp-blue" size={24} /></div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center text-sm text-gray-500">
            No messages sent yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {rows.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {item.delegateId ? (
                        <Link href={`/admin/delegates/${item.delegateId}`} className="text-sm font-medium text-npp-blue hover:underline">
                          {item.delegateName || 'Delegate'}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">Unknown delegate</p>
                      )}
                      <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === 'sent' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {item.phone} · {new Date(item.createdAt).toLocaleString()}
                    {item.error ? ` · ${item.error}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

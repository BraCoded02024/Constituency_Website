'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BarChart3, Loader2, Users, CheckCircle2, HelpCircle, ThumbsUp,
  ThumbsDown, Waves, RefreshCw, CalendarClock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

interface BreakdownRow {
  id: string;
  name: string;
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
  electoralAreaId?: string;
  electoralAreaName?: string | null;
}

interface SurveyStats {
  thresholds: { supportingStrong: number; notSupportingAttention: number; floatingPersuasion: number };
  totalDelegates: number;
  surveyed: number;
  notSurveyed: number;
  supporting: number;
  notSupporting: number;
  floating: number;
  supportingPct: number;
  notSupportingPct: number;
  floatingPct: number;
  surveyedPct: number;
  activeDelegates?: number;
  inactiveDelegates?: number;
  followUpsDue?: number;
  byGender?: { name: string; total: number }[];
  upcomingFollowUps?: {
    id: string;
    fullName: string;
    delegateCode: string | null;
    nextFollowUpAt: string;
    currentStatus: string | null;
    electoralAreaName: string | null;
  }[];
  byElectoralArea: BreakdownRow[];
  byPollingStation: BreakdownRow[];
  byCategory: BreakdownRow[];
  bySurveyOfficer: {
    id: string | null;
    name: string;
    surveysRecorded: number;
    delegatesSurveyed: number;
    lastSurveyAt: string | null;
  }[];
  classifications: {
    strongAreas: BreakdownRow[];
    needsAttention: BreakdownRow[];
    persuasionAreas: BreakdownRow[];
  };
  recentSurveys: {
    id: string;
    status: string;
    confidence: string;
    createdAt: string;
    delegateId: string;
    delegateName: string;
    delegateCode: string | null;
    officerName: string | null;
    electoralAreaName: string | null;
  }[];
}

const STATUS_COLORS = {
  supporting: '#15803d',
  notSupporting: '#b91c1c',
  floating: '#d97706',
  notSurveyed: '#94a3b8',
};

function StatCard({
  label, value, sub, icon: Icon, tone,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    ['Supporting', STATUS_COLORS.supporting],
    ['Not supporting', STATUS_COLORS.notSupporting],
    ['Floating', STATUS_COLORS.floating],
    ['Not surveyed', STATUS_COLORS.notSurveyed],
  ] as const;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function CoverageRing({ pct }: { pct: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(pct, 0), 100) / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0" aria-hidden>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#003DA5"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">
        {pct}%
      </text>
    </svg>
  );
}

function StatusBars({ stats }: { stats: SurveyStats }) {
  const items = [
    { label: 'Supporting', value: stats.supporting, color: STATUS_COLORS.supporting },
    { label: 'Not supporting', value: stats.notSupporting, color: STATUS_COLORS.notSupporting },
    { label: 'Floating', value: stats.floating, color: STATUS_COLORS.floating },
    { label: 'Not surveyed', value: stats.notSurveyed, color: STATUS_COLORS.notSurveyed },
  ];
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="flex items-end gap-3 h-52 pt-2">
      {items.map((item) => (
        <div key={item.label} className="flex-1 h-full flex flex-col items-center justify-end min-w-0">
          <span className="text-sm font-semibold text-gray-900 tabular-nums">{item.value}</span>
          <div
            className="w-full max-w-14 rounded-t-lg mt-1 transition-all"
            style={{
              height: `${Math.max((item.value / max) * 78, item.value > 0 ? 8 : 3)}%`,
              backgroundColor: item.color,
            }}
          />
          <span className="text-[11px] text-gray-500 text-center mt-2 leading-tight">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function StackedRows({ rows, emptyLabel }: { rows: BreakdownRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 py-6 text-center">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...rows.map((row) => row.total));
  return (
    <div className="space-y-3.5">
      {rows.map((row) => {
        const parts = [
          [row.supporting, STATUS_COLORS.supporting],
          [row.notSupporting, STATUS_COLORS.notSupporting],
          [row.floating, STATUS_COLORS.floating],
          [row.notSurveyed, STATUS_COLORS.notSurveyed],
        ] as const;
        return (
          <div key={row.id}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <p className="text-sm font-medium text-gray-800 truncate">{row.name}</p>
              <p className="text-xs text-gray-500 tabular-nums shrink-0">
                {row.total} · {row.surveyedPct}% surveyed
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full flex" style={{ width: `${row.total === 0 ? 0 : Math.max((row.total / max) * 100, 6)}%` }}>
                {row.total > 0 && parts.map(([value, color], index) => (
                  value > 0 ? (
                    <span
                      key={`${row.id}-${index}`}
                      style={{ width: `${(value / row.total) * 100}%`, backgroundColor: color }}
                    />
                  ) : null
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClassCard({ title, hint, rows, tone }: { title: string; hint: string; rows: BreakdownRow[]; tone: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-[11px] text-gray-500 mt-0.5 mb-3">{hint}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">None currently match this grouping.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="text-sm text-gray-800">
              <div className="flex justify-between gap-2">
                <span className="font-medium truncate">{row.name}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{row.surveyed} surveyed</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Supporting {row.supportingPct}% · Not supporting {row.notSupportingPct}% · Floating {row.floatingPct}%
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BreakdownTable({ title, rows, showArea }: { title: string; rows: BreakdownRow[]; showArea?: boolean }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-sm text-gray-500">No data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                {showArea && <th className="px-4 py-2">Area</th>}
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Surveyed</th>
                <th className="px-4 py-2">Supporting</th>
                <th className="px-4 py-2">Not supporting</th>
                <th className="px-4 py-2">Floating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                  {showArea && <td className="px-4 py-2.5 text-gray-500">{row.electoralAreaName || '—'}</td>}
                  <td className="px-4 py-2.5 tabular-nums">{row.total}</td>
                  <td className="px-4 py-2.5 tabular-nums">{row.surveyed} <span className="text-xs text-gray-400">({row.surveyedPct}%)</span></td>
                  <td className="px-4 py-2.5 text-green-700 tabular-nums">{row.supporting} <span className="text-xs">({row.supportingPct}%)</span></td>
                  <td className="px-4 py-2.5 text-red-700 tabular-nums">{row.notSupporting} <span className="text-xs">({row.notSupportingPct}%)</span></td>
                  <td className="px-4 py-2.5 text-amber-700 tabular-nums">{row.floating} <span className="text-xs">({row.floatingPct}%)</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function DelegateDashboard() {
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.delegateDashboard.getStats()
      .then((data) => setStats(data as SurveyStats))
      .catch(() => toast.error('Failed to load delegate dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useDeferredEffect(() => { load(); }, [load]);

  if (loading && !stats) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>;
  }

  if (!stats) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-gray-500">Could not load delegate statistics.</p>
        <button onClick={load} className="text-sm text-npp-blue font-medium inline-flex items-center gap-1">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const genderMax = Math.max(1, ...(stats.byGender || []).map((row) => row.total));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-npp-blue" size={22} /> Delegate Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Survey coverage and support across electoral areas, polling stations, and categories.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link
            href="/admin/delegates"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium"
          >
            Open Delegates
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total delegates" value={stats.totalDelegates} sub={`${stats.activeDelegates ?? stats.totalDelegates} active`} icon={Users} tone="bg-npp-blue" />
        <StatCard label="Surveyed" value={stats.surveyed} sub={`${stats.surveyedPct}% of the roll`} icon={CheckCircle2} tone="bg-teal-600" />
        <StatCard label="Not surveyed" value={stats.notSurveyed} icon={HelpCircle} tone="bg-slate-500" />
        <StatCard label="Supporting" value={stats.supporting} sub={`${stats.supportingPct}% of surveyed`} icon={ThumbsUp} tone="bg-green-600" />
        <StatCard label="Not supporting" value={stats.notSupporting} sub={`${stats.notSupportingPct}% of surveyed`} icon={ThumbsDown} tone="bg-red-600" />
        <StatCard label="Floating" value={stats.floating} sub={`${stats.floatingPct}% of surveyed`} icon={Waves} tone="bg-amber-500" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <section className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Survey standing</h2>
              <p className="text-[11px] text-gray-500">Current status of every registered delegate.</p>
            </div>
            <Legend />
          </div>
          <StatusBars stats={stats} />
        </section>

        <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center">
          <CoverageRing pct={stats.surveyedPct} />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">Survey coverage</h2>
            <p className="text-xs text-gray-500 mt-1">
              {stats.surveyed} of {stats.totalDelegates} delegates have a recorded survey.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {`${stats.followUpsDue ?? 0} follow-up${(stats.followUpsDue ?? 0) === 1 ? '' : 's'} due. ${stats.inactiveDelegates ?? 0} inactive.`}
            </p>
            {stats.totalDelegates === 0 && (
              <p className="text-xs text-npp-blue mt-3">Add delegates to start filling these charts.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-900">By electoral area</h2>
            <Legend />
          </div>
          <StackedRows rows={stats.byElectoralArea} emptyLabel="No electoral areas yet." />
        </section>
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-900">By category</h2>
            <Legend />
          </div>
          <StackedRows rows={stats.byCategory} emptyLabel="No categories yet." />
        </section>
      </div>

      {(stats.byGender || []).length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">By gender</h2>
          <div className="space-y-2.5">
            {stats.byGender!.map((row) => (
              <div key={row.name} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
                <span className="text-sm text-gray-700 truncate">{row.name}</span>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-npp-blue rounded-full" style={{ width: `${(row.total / genderMax) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 tabular-nums text-right">{row.total}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">Area groupings</h2>
        <p className="text-xs text-gray-500">
          Based on surveyed delegates only. Strong: supporting at least {stats.thresholds.supportingStrong}%.
          Needs attention: not supporting at least {stats.thresholds.notSupportingAttention}%.
          Persuasion: floating at least {stats.thresholds.floatingPersuasion}%.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ClassCard title="Strong areas" hint={`Supporting ≥ ${stats.thresholds.supportingStrong}%`} rows={stats.classifications.strongAreas} tone="border-green-100 bg-green-50/50" />
          <ClassCard title="Needs attention" hint={`Not supporting ≥ ${stats.thresholds.notSupportingAttention}%`} rows={stats.classifications.needsAttention} tone="border-red-100 bg-red-50/50" />
          <ClassCard title="Persuasion areas" hint={`Floating ≥ ${stats.thresholds.floatingPersuasion}%`} rows={stats.classifications.persuasionAreas} tone="border-amber-100 bg-amber-50/50" />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <CalendarClock size={16} className="text-npp-blue" />
            <h2 className="text-sm font-semibold text-gray-900 flex-1">Follow-ups</h2>
            <Link href="/admin/follow-ups" className="text-xs font-medium text-npp-blue">View all</Link>
          </div>
          {(stats.upcomingFollowUps || []).length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No follow-up dates recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats.upcomingFollowUps!.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <Link href={`/admin/delegates/${item.id}`} className="text-sm font-medium text-npp-blue hover:underline">
                    {item.fullName} {item.delegateCode ? `(${item.delegateCode})` : ''}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {item.nextFollowUpAt.slice(0, 10)} · {item.currentStatus || 'Not surveyed'} · {item.electoralAreaName || 'Unassigned area'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent surveys</h2>
          </div>
          {stats.recentSurveys.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No survey activity yet. Record one from a delegate profile.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats.recentSurveys.map((survey) => (
                <li key={survey.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <Link href={`/admin/delegates/${survey.delegateId}`} className="text-sm font-medium text-npp-blue hover:underline">
                      {survey.delegateName} {survey.delegateCode ? `(${survey.delegateCode})` : ''}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {survey.status} · {survey.confidence} · {survey.electoralAreaName || 'Unassigned area'} · {survey.officerName || 'No officer'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(survey.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <BreakdownTable title="Polling stations" rows={stats.byPollingStation} showArea />
      <BreakdownTable title="Electoral areas" rows={stats.byElectoralArea} />
      <BreakdownTable title="Categories" rows={stats.byCategory} />

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Survey officers</h2>
        </div>
        {stats.bySurveyOfficer.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No surveys recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2">Officer</th>
                  <th className="px-4 py-2">Surveys</th>
                  <th className="px-4 py-2">Delegates</th>
                  <th className="px-4 py-2">Last survey</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.bySurveyOfficer.map((officer, index) => (
                  <tr key={officer.id || `officer-${index}`}>
                    <td className="px-4 py-2.5 font-medium">{officer.name}</td>
                    <td className="px-4 py-2.5 tabular-nums">{officer.surveysRecorded}</td>
                    <td className="px-4 py-2.5 tabular-nums">{officer.delegatesSurveyed}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {officer.lastSurveyAt ? new Date(officer.lastSurveyAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

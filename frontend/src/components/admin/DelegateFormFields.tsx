'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  GENDER_OPTIONS,
  STATUS_OPTIONS,
  type DelegateFormState,
  type ElectoralArea,
  type PollingStation,
  type DelegateCategory,
} from '@/lib/delegateTypes';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

interface Props {
  form: DelegateFormState;
  errors?: Record<string, string>;
  onChange: (next: DelegateFormState) => void;
}

export default function DelegateFormFields({ form, errors = {}, onChange }: Props) {
  const [areas, setAreas] = useState<ElectoralArea[]>([]);
  const [stations, setStations] = useState<PollingStation[]>([]);
  const [categories, setCategories] = useState<DelegateCategory[]>([]);

  useDeferredEffect(() => {
    api.electoralAreas.getAll({ active: true })
      .then((data) => setAreas(data as ElectoralArea[]))
      .catch(() => setAreas([]));
    api.delegateCategories.getAll({ active: true })
      .then((data) => setCategories(data as DelegateCategory[]))
      .catch(() => setCategories([]));
  }, []);

  useDeferredEffect(() => {
    if (!form.electoralAreaId) {
      setStations([]);
      return;
    }
    let cancelled = false;
    api.pollingStations.getAll({ electoralAreaId: form.electoralAreaId, active: true })
      .then((data) => { if (!cancelled) setStations(data as PollingStation[]); })
      .catch(() => { if (!cancelled) setStations([]); });
    return () => { cancelled = true; };
  }, [form.electoralAreaId]);

  const set = (patch: Partial<DelegateFormState>) => onChange({ ...form, ...patch });

  const field = (label: string, key: keyof DelegateFormState, input: React.ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {input}
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-npp-blue/30 focus:border-npp-blue';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {field('Full Name *', 'fullName', (
        <input className={inputCls} value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} required />
      ))}
      {field('Phone', 'phone', (
        <input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="0241234567" />
      ))}
      {field('Email', 'email', (
        <input type="email" className={inputCls} value={form.email} onChange={(e) => set({ email: e.target.value })} />
      ))}
      {field('Gender', 'gender', (
        <select className={inputCls} value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
          <option value="">Select</option>
          {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      ))}
      {field('Ghana Card', 'ghanaCard', (
        <input className={inputCls} value={form.ghanaCard} onChange={(e) => set({ ghanaCard: e.target.value })} placeholder="GHA-123456789-0" />
      ))}
      {field("Voter's ID", 'votersId', (
        <input className={inputCls} value={form.votersId} onChange={(e) => set({ votersId: e.target.value })} />
      ))}
      {field('Address', 'address', (
        <input className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} />
      ))}
      {field('Community', 'community', (
        <input className={inputCls} value={form.community} onChange={(e) => set({ community: e.target.value })} />
      ))}
      {field('Electoral Area', 'electoralAreaId', (
        <select
          className={inputCls}
          value={form.electoralAreaId}
          onChange={(e) => set({ electoralAreaId: e.target.value, pollingStationId: '' })}
        >
          <option value="">Select area</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      ))}
      {field('Polling Station', 'pollingStationId', (
        <select
          className={inputCls}
          value={form.pollingStationId}
          onChange={(e) => {
            const id = e.target.value;
            const st = stations.find((s) => s.id === id);
            set({
              pollingStationId: id,
              pollingStationName: st?.name || form.pollingStationName,
              pollingStationCode: st?.code || form.pollingStationCode,
            });
          }}
          disabled={!form.electoralAreaId}
        >
          <option value="">{form.electoralAreaId ? 'Select station' : 'Select area first'}</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
          ))}
        </select>
      ))}
      {field('Station Name (legacy)', 'pollingStationName', (
        <input className={inputCls} value={form.pollingStationName} onChange={(e) => set({ pollingStationName: e.target.value })} />
      ))}
      {field('Station Code (legacy)', 'pollingStationCode', (
        <input className={inputCls} value={form.pollingStationCode} onChange={(e) => set({ pollingStationCode: e.target.value })} />
      ))}
      {field('Category', 'categoryId', (
        <select className={inputCls} value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      ))}
      {field('Status', 'status', (
        <select className={inputCls} value={form.status} onChange={(e) => set({ status: e.target.value })}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ))}
      <div className="md:col-span-2">
        {field('Notes', 'notes', (
          <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        ))}
      </div>
    </div>
  );
}

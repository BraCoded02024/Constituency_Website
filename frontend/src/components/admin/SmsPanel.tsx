'use client';

import { useCallback, useState } from 'react';
import { Loader2, MessageSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

interface SmsRecord {
  id: string;
  delegateName?: string | null;
  phone: string;
  message: string;
  status: string;
  error?: string | null;
  createdAt: string;
}

export function reminderMessage(name: string) {
  const first = name.trim().split(/\s+/)[0] || 'there';
  return `Hello ${first}, this is a reminder from NPP Sunyani East. Our team would like to follow up with you. Kindly expect a call.`;
}

export function SmsPanel({
  delegateId,
  name,
  phone,
  defaultMessage,
  compact = false,
}: {
  delegateId: string;
  name: string;
  phone?: string | null;
  defaultMessage?: string;
  compact?: boolean;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [history, setHistory] = useState<SmsRecord[]>([]);
  const [message, setMessage] = useState(defaultMessage || reminderMessage(name));
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    api.sms.status().then((data) => setConfigured(data.configured)).catch(() => setConfigured(false));
    if (!compact) {
      api.sms.list(delegateId).then((rows) => setHistory(rows as SmsRecord[])).catch(() => setHistory([]));
    }
  }, [compact, delegateId]);

  useDeferredEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!message.trim()) {
      toast.error('Write a message first');
      return;
    }
    setSending(true);
    try {
      await api.sms.send({ delegateIds: [delegateId], message: message.trim() });
      toast.success(`SMS sent to ${name}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SMS failed');
      load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'bg-white rounded-2xl border border-gray-100 p-5 space-y-3'}>
      {!compact && <h2 className="text-sm font-semibold text-gray-900">SMS</h2>}
      <p className="text-xs text-gray-500">
        {phone ? `Sends to ${phone} through Arkesel.` : 'This delegate has no phone number.'}
        {configured === false && ' Add ARKESEL_API_KEY and ARKESEL_SENDER_ID in backend/.env, then restart the API.'}
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={compact ? 4 : 3}
        maxLength={480}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-npp-blue/30"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">{message.trim().length}/480</span>
        <button
          type="button"
          onClick={send}
          disabled={sending || !phone || configured === false}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
          Send SMS
        </button>
      </div>
      {!compact && history.length > 0 && (
        <ul className="divide-y divide-gray-50 border-t border-gray-100 pt-2">
          {history.slice(0, 5).map((item) => (
            <li key={item.id} className="py-2">
              <p className="text-sm text-gray-800">{item.message}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {item.status} · {new Date(item.createdAt).toLocaleString()}
                {item.error ? ` · ${item.error}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SmsDialog({
  delegateId,
  name,
  phone,
  onClose,
}: {
  delegateId: string;
  name: string;
  phone?: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Text {name}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <SmsPanel delegateId={delegateId} name={name} phone={phone} compact />
      </div>
    </div>
  );
}

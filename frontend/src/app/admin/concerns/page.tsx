'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Trash2, MessageSquare, X, Send, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface ConcernResponse {
  id: string;
  message: string;
  respondedBy: string;
  respondedAt: string;
}

interface Concern {
  id: string;
  name: string;
  phone: string;
  community: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  submittedAt: string;
  responses: ConcernResponse[];
}

const STATUSES = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function AdminConcernsPage() {
  const searchParams = useSearchParams();
  const appliedOpenRef = useRef<string | null>(null);
  const [items, setItems] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => {
    api.concerns.getAll()
      .then(data => setItems(data as Concern[]))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const st = searchParams.get('status');
    if (st && (STATUSES as readonly string[]).includes(st)) setFilter(st);
    const cat = searchParams.get('category');
    if (cat) setSearch(decodeURIComponent(cat));
  }, [searchParams]);

  useEffect(() => {
    const open = searchParams.get('open');
    if (!open) {
      appliedOpenRef.current = null;
      return;
    }
    if (items.length === 0) return;
    if (!items.some(c => c.id === open)) return;
    if (appliedOpenRef.current === open) return;
    appliedOpenRef.current = open;
    setExpandedId(open);
    requestAnimationFrame(() => {
      document.getElementById(`concern-${open}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [searchParams, items]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.concerns.updateStatus(id, { status });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const handlePriorityChange = async (id: string, priority: string) => {
    try {
      await api.concerns.updateStatus(id, { status: items.find(c => c.id === id)!.status, priority });
      toast.success('Priority updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) { toast.error('Enter a message'); return; }
    setSending(true);
    try {
      await api.concerns.respond(id, { message: replyText, status: replyStatus || undefined });
      toast.success('Response sent');
      setReplyId(null);
      setReplyText('');
      setReplyStatus('');
      load();
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this concern?')) return;
    try { await api.concerns.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const byStatus = filter === 'all' ? items : items.filter(c => c.status === filter);
  const q = search.trim().toLowerCase();
  const filtered = !q
    ? byStatus
    : byStatus.filter(c =>
        c.category.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.community.toLowerCase().includes(q)
      );

  const statusColor = (s: string) => {
    if (s === 'Pending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'In Progress') return 'bg-blue-100 text-blue-700';
    if (s === 'Resolved') return 'bg-green-100 text-green-700';
    if (s === 'Under Review') return 'bg-purple-100 text-purple-700';
    if (s === 'Closed') return 'bg-gray-200 text-gray-600';
    return 'bg-gray-100 text-gray-700';
  };

  const priorityColor = (p: string) => {
    if (p === 'Critical') return 'bg-red-100 text-red-700';
    if (p === 'High') return 'bg-orange-100 text-orange-700';
    if (p === 'Medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ghana-green" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Concerns & Issues</h1>
          <p className="text-sm text-gray-500">{items.length} total &middot; {items.filter(c => c.status === 'Pending').length} pending</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-ghana-green text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {s === 'all' ? 'All' : s} {s === 'all' ? `(${items.length})` : `(${items.filter(c => c.status === s).length})`}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subject, name, category…"
            className="w-full pl-3 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(item => (
          <div id={`concern-${item.id}`} key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900">{item.subject}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(item.status)}`}>{item.status}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityColor(item.priority)}`}>{item.priority}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{item.name} &middot; {item.phone} &middot; {item.community}</p>
                  <p className="text-xs text-gray-400">{item.category} &middot; {item.submittedAt}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                    {expandedId === item.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button onClick={() => { setReplyId(replyId === item.id ? null : item.id); setReplyText(''); }} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                    <MessageSquare size={15} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{item.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <select value={item.status} onChange={e => handleStatusChange(item.id, e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:border-ghana-green outline-none">
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select value={item.priority} onChange={e => handlePriorityChange(item.id, e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:border-ghana-green outline-none">
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  {item.responses && item.responses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600">Responses ({item.responses.length})</p>
                      {item.responses.map(r => (
                        <div key={r.id} className="bg-ghana-green/5 border border-ghana-green/10 rounded-lg p-3">
                          <p className="text-sm text-gray-800">{r.message}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{r.respondedBy} &middot; {new Date(r.respondedAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {replyId === item.id && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your response to the constituent..." rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-ghana-green outline-none resize-none" />
                  <div className="flex items-center justify-between">
                    <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:border-ghana-green outline-none">
                      <option value="">Keep current status</option>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setReplyId(null)} className="px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                      <button onClick={() => handleReply(item.id)} disabled={sending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-ghana-green text-white hover:bg-ghana-green/90 disabled:opacity-50">
                        {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-400 bg-white rounded-xl border border-gray-100">No concerns found</p>}
      </div>
    </div>
  );
}

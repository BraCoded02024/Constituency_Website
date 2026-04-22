'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Users, AlertTriangle, FolderKanban, Megaphone,
  Calendar, UserPlus, TrendingUp, Clock, CheckCircle2, Loader2, Wrench, Star, ChevronRight,
} from 'lucide-react';

interface DashboardStats {
  totalConstituents: number;
  totalConcerns: number;
  pendingConcerns: number;
  inProgressConcerns: number;
  resolvedConcerns: number;
  underReviewConcerns: number;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  totalAnnouncements: number;
  totalEvents: number;
  totalVolunteers: number;
  totalOpportunities: number;
  totalGalleryItems: number;
  totalSuccessStories: number;
  totalServices: number;
  recentRegistrations: { id: string; fullName: string; community: string; registeredAt: string }[];
  recentConcerns: { id: string; name: string; subject: string; status: string; priority: string; submittedAt: string }[];
  projectProgress: { id: string; title: string; progress: number; status: string }[];
  concernsByCategory: Record<string, number>;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.getStats()
      .then(data => setStats(data as DashboardStats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-ghana-green" />
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">Failed to load dashboard data.</p>;

  const cards: { label: string; value: number; icon: typeof Users; color: string; href: string }[] = [
    { label: 'Constituents', value: stats.totalConstituents, icon: Users, color: 'bg-blue-500', href: '/admin/constituents' },
    { label: 'Concerns', value: stats.totalConcerns, icon: AlertTriangle, color: 'bg-orange-500', href: '/admin/concerns' },
    { label: 'Projects', value: stats.totalProjects, icon: FolderKanban, color: 'bg-ghana-green', href: '/admin/projects' },
    { label: 'Announcements', value: stats.totalAnnouncements, icon: Megaphone, color: 'bg-purple-500', href: '/admin/announcements' },
    { label: 'Events', value: stats.totalEvents, icon: Calendar, color: 'bg-pink-500', href: '/admin/events' },
    { label: 'Volunteers', value: stats.totalVolunteers, icon: UserPlus, color: 'bg-teal-500', href: '/admin/volunteers' },
    { label: 'Opportunities', value: stats.totalOpportunities, icon: TrendingUp, color: 'bg-indigo-500', href: '/admin/opportunities' },
    { label: 'Services', value: stats.totalServices, icon: Wrench, color: 'bg-slate-500', href: '/admin/services' },
    { label: 'Gallery', value: stats.totalGalleryItems, icon: CheckCircle2, color: 'bg-amber-500', href: '/admin/gallery' },
    { label: 'Success stories', value: stats.totalSuccessStories, icon: Star, color: 'bg-rose-500', href: '/admin/stories' },
  ];

  const statusColor = (s: string) => {
    if (s === 'Pending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'In Progress') return 'bg-blue-100 text-blue-700';
    if (s === 'Resolved') return 'bg-green-100 text-green-700';
    if (s === 'Under Review') return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const priorityColor = (p: string) => {
    if (p === 'High') return 'text-red-600';
    if (p === 'Medium') return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-1">Click a metric or row to go to the matching admin screen.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {cards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm hover:border-ghana-green/35 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ghana-green/40 focus-visible:ring-offset-2"
          >
            <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
              <card.icon size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
              <p className="text-xs text-gray-500 group-hover:text-ghana-green font-medium flex items-center gap-0.5">
                {card.label}
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-0.5 group-hover:translate-x-0 transition-all" />
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 flex-wrap">
            <Link href="/admin/concerns" className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity">
              <AlertTriangle size={16} className="text-orange-500 shrink-0" />
              <h3 className="font-semibold text-sm text-gray-900">Recent Concerns</h3>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
            </Link>
            <Link
              href="/admin/concerns?status=Pending"
              className="ml-auto sm:ml-0 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full hover:bg-orange-100 transition-colors"
            >
              {stats.pendingConcerns} pending
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentConcerns.map(c => (
              <Link
                key={c.id}
                href={`/admin/concerns?open=${encodeURIComponent(c.id)}`}
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-ghana-green">{c.subject}</p>
                  <p className="text-xs text-gray-500">{c.name} &middot; {c.submittedAt}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>
                  {c.status}
                </span>
                <span className={`text-[10px] font-semibold ${priorityColor(c.priority)}`}>
                  {c.priority}
                </span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-ghana-green shrink-0" />
              </Link>
            ))}
            {stats.recentConcerns.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No concerns yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-0">
          <Link href="/admin/projects" className="p-4 border-b border-gray-100 flex items-center gap-2 hover:bg-gray-50/50 transition-colors rounded-t-xl">
            <FolderKanban size={16} className="text-ghana-green" />
            <h3 className="font-semibold text-sm text-gray-900">Project progress</h3>
            <ChevronRight size={14} className="text-gray-300 ml-auto" />
          </Link>
          <div className="divide-y divide-gray-50">
            {stats.projectProgress.map(p => (
              <Link
                key={p.id}
                href={`/admin/projects?edit=${encodeURIComponent(p.id)}`}
                className="block px-4 py-3 hover:bg-gray-50/80 transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-ghana-green">{p.title}</p>
                  <span className="text-xs font-semibold text-ghana-green flex items-center gap-1 tabular-nums">
                    {p.progress}%
                    <ChevronRight size={12} className="text-gray-300 group-hover:text-ghana-green" />
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-ghana-green h-1.5 rounded-full transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </Link>
            ))}
            {stats.projectProgress.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No projects yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-0">
          <Link href="/admin/constituents" className="p-4 border-b border-gray-100 flex items-center gap-2 hover:bg-gray-50/50 transition-colors rounded-t-xl">
            <Users size={16} className="text-blue-500" />
            <h3 className="font-semibold text-sm text-gray-900">Recent registrations</h3>
            <ChevronRight size={14} className="text-gray-300 ml-auto" />
          </Link>
          <div className="divide-y divide-gray-50">
            {stats.recentRegistrations.map(r => (
              <Link
                key={r.id}
                href={`/admin/constituents?q=${encodeURIComponent(r.fullName)}`}
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                  {r.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-ghana-green">{r.fullName}</p>
                  <p className="text-xs text-gray-500">{r.community} &middot; {r.registeredAt}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-ghana-green shrink-0" />
              </Link>
            ))}
            {stats.recentRegistrations.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No registrations yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-0">
          <Link href="/admin/concerns" className="p-4 border-b border-gray-100 flex items-center gap-2 hover:bg-gray-50/50 transition-colors rounded-t-xl">
            <Clock size={16} className="text-purple-500" />
            <h3 className="font-semibold text-sm text-gray-900">Concern breakdown</h3>
            <ChevronRight size={14} className="text-gray-300 ml-auto" />
          </Link>
          <div className="p-4 space-y-2">
            {Object.entries(stats.concernsByCategory).map(([cat, count]) => (
              <Link
                key={cat}
                href={`/admin/concerns?category=${encodeURIComponent(cat)}`}
                className="flex items-center justify-between gap-3 rounded-lg px-2 -mx-2 py-2 hover:bg-purple-50/60 transition-colors group"
              >
                <span className="text-sm text-gray-600 truncate group-hover:text-ghana-green font-medium">{cat}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${stats.totalConcerns > 0 ? (count / stats.totalConcerns) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right tabular-nums">{count}</span>
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-ghana-green" />
                </div>
              </Link>
            ))}
            {Object.keys(stats.concernsByCategory).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

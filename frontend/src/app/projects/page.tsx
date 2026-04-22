'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Calendar, Banknote, HardHat, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/motion';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/mediaUrl';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  budget: string;
  startDate: string;
  endDate: string;
  contractor: string;
  category: string;
  image?: string | null;
}

const statuses = ['All', 'In Progress', 'Completed', 'Planning'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.projects.getAll().then((d) => setProjects(d as Project[])).catch(() => {});
  }, []);

  const filtered = projects.filter((p) => {
    const matchStatus = filter === 'All' || p.status === filter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusColors: Record<string, string> = {
    'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Completed: 'bg-green-100 text-green-700 border-green-200',
    Planning: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const progressColors: Record<string, string> = {
    'In Progress': 'bg-ghana-gold',
    Completed: 'bg-green-500',
    Planning: 'bg-blue-400',
  };

  const summaryStats = [
    { label: 'Total Projects', value: projects.length, color: 'bg-ghana-green' },
    { label: 'In Progress', value: projects.filter((p) => p.status === 'In Progress').length, color: 'bg-ghana-gold' },
    { label: 'Completed', value: projects.filter((p) => p.status === 'Completed').length, color: 'bg-green-500' },
    { label: 'Planning', value: projects.filter((p) => p.status === 'Planning').length, color: 'bg-blue-500' },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Track the progress of constituency development projects in real-time"
        icon={FolderKanban}
      />

      {/* Summary Stats */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-gray-50">
                <p className="text-3xl font-bold text-ghana-black">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-ghana-green text-white'
                      : 'bg-white text-gray-600 hover:bg-ghana-green/10 border border-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Projects List */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {filtered.map((project) => (
              <motion.div key={project.id} variants={staggerItem}>
                <article className="group flex flex-col lg:flex-row bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-xl hover:border-ghana-green/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                  {/* Media column */}
                  <div
                    className={`relative w-full lg:w-[min(42%,380px)] xl:w-[400px] shrink-0 ${
                      project.image
                        ? 'h-52 sm:h-60 lg:h-auto lg:min-h-[280px]'
                        : 'h-44 sm:h-52 lg:min-h-[280px] bg-gradient-to-br from-ghana-green/[0.07] via-gray-50 to-ghana-gold/[0.12]'
                    }`}
                  >
                    {project.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaUrl(project.image)}
                          alt={project.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 lg:bg-gradient-to-r lg:from-black/20 lg:via-transparent lg:to-transparent pointer-events-none"
                          aria-hidden
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                          <FolderKanban size={28} className="text-ghana-green/50" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 tracking-wide uppercase">No photo</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center min-w-0 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border ${statusColors[project.status] || ''}`}>
                        {project.status}
                      </span>
                      <span className="text-[11px] font-medium text-ghana-green bg-ghana-green/10 px-2.5 py-1 rounded-md">
                        {project.category}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xl sm:text-2xl text-ghana-black tracking-tight leading-snug group-hover:text-ghana-green transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-2 leading-relaxed line-clamp-3 sm:line-clamp-none">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-1 sm:gap-0 sm:text-right shrink-0 rounded-xl bg-ghana-green/5 border border-ghana-green/10 px-4 py-3 sm:py-4 sm:min-w-[100px]">
                        <p className="text-2xl sm:text-3xl font-bold text-ghana-green tabular-nums leading-none">{project.progress}%</p>
                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">complete</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>Overall progress</span>
                        <span className="font-semibold text-ghana-black">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden ring-1 ring-gray-100/80">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${project.progress}%` }}
                          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                          viewport={{ once: true }}
                          className={`h-full rounded-full ${progressColors[project.status] || 'bg-ghana-green'}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-xl bg-gray-50/90 border border-gray-100/80">
                      <div className="flex gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Banknote size={16} className="text-ghana-green" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Budget</p>
                          <p className="font-semibold text-ghana-black text-sm truncate">{project.budget}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Calendar size={16} className="text-ghana-green" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Start</p>
                          <p className="font-semibold text-ghana-black text-sm">
                            {new Date(project.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Calendar size={16} className="text-ghana-green" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">End</p>
                          <p className="font-semibold text-ghana-black text-sm">
                            {new Date(project.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 min-w-0 col-span-2 lg:col-span-1">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                          <HardHat size={16} className="text-ghana-green" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Contractor</p>
                          <p className="font-semibold text-ghana-black text-sm truncate">{project.contractor}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <FolderKanban size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No projects found.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

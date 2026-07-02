'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Search, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SafeImage from '@/components/SafeImage';
import { CardSkeletonGrid, EmptyState, ErrorBanner } from '@/components/ContentState';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { api } from '@/lib/api';
import { seedAnnouncements } from '@/lib/seedContent';
import { usePublicList } from '@/lib/usePublicList';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  image: string;
  urgent: boolean;
}

const categories = ['All', 'Health', 'Infrastructure', 'Education', 'Security', 'Events'];

export default function AnnouncementsPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const { data: announcements, loading, error, fromFallback } = usePublicList<Announcement>(
    () => api.announcements.getAll(),
    seedAnnouncements,
    retryKey,
  );

  const filtered = announcements.filter((a) => {
    const matchCategory = filter === 'All' || a.category === filter;
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const isFiltered = filter !== 'All' || search.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Stay updated with the latest news and announcements from the constituency office"
        icon={Megaphone}
      />

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && fromFallback ? (
            <ErrorBanner onRetry={() => setRetryKey((k) => k + 1)} />
          ) : null}

          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-npp-blue/20 npp-card"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === cat
                      ? 'bg-npp-blue text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-npp-blue/10 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <CardSkeletonGrid count={6} />
          ) : filtered.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((item) => (
                <motion.div key={item.id} variants={staggerItem}>
                  <article className="npp-card overflow-hidden transition-all duration-300 group hover:-translate-y-1 h-full flex flex-col">
                    <div className="h-52 overflow-hidden relative">
                      <SafeImage
                        src={item.image}
                        alt={item.title}
                        category={item.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        placeholderClassName="w-full h-full"
                      />
                      {item.urgent && (
                        <div className="absolute top-3 left-3 bg-npp-red text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                          <AlertTriangle size={12} />
                          <span>URGENT</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-npp-blue text-xs font-semibold px-3 py-1 rounded-full">
                        {item.category}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <p className="text-gray-400 text-xs mb-2">
                        {new Date(item.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <h3 className="font-semibold text-gray-900 text-lg mb-3 group-hover:text-npp-blue transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed flex-1">{item.content}</p>
                    </div>
                  </article>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Constituency notices will appear here as they are published by the office."
              actionLabel="Join for updates"
              actionHref="/register"
              filtered={isFiltered}
            />
          )}
        </div>
      </section>
    </>
  );
}

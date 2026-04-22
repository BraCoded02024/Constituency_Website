'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Search, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { api } from '@/lib/api';

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.announcements.getAll().then((d) => setAnnouncements(d as Announcement[])).catch(() => {});
  }, []);

  const filtered = announcements.filter((a) => {
    const matchCategory = filter === 'All' || a.category === filter;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Stay updated with the latest news and announcements from the constituency office"
        icon={Megaphone}
      />

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-ghana-green/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === cat
                      ? 'bg-ghana-green text-white'
                      : 'bg-white text-gray-600 hover:bg-ghana-green/10 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:-translate-y-1 h-full flex flex-col">
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.urgent && (
                      <div className="absolute top-3 left-3 bg-ghana-red text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                        <AlertTriangle size={12} />
                        <span>URGENT</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-ghana-green text-xs font-semibold px-3 py-1 rounded-full">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-gray-400 text-xs mb-2">
                      {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="font-semibold text-ghana-black text-lg mb-3 group-hover:text-ghana-green transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed flex-1">{item.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No announcements found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

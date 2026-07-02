'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Clock, Users, CheckCircle, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { api } from '@/lib/api';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: string;
  deadline: string;
  requirements: string[];
  slots: number;
  applied: number;
}

const types = ['All', 'Employment', 'Training', 'Grants', 'Volunteer'];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.opportunities.getAll().then((d) => setOpportunities(d as Opportunity[])).catch(() => {});
  }, []);

  const filtered = opportunities.filter((o) => {
    const matchType = filter === 'All' || o.type === filter;
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const typeColors: Record<string, string> = {
    Employment: 'bg-blue-100 text-blue-700',
    Training: 'bg-purple-100 text-purple-700',
    Grants: 'bg-green-100 text-green-700',
    Volunteer: 'bg-orange-100 text-orange-700',
  };

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle="Explore training programs, employment openings, grants, and volunteer opportunities"
        icon={Briefcase}
      />

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === type
                      ? 'bg-npp-blue text-white'
                      : 'bg-white text-gray-600 hover:bg-npp-blue/10 border border-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-6"
          >
            {filtered.map((item) => {
              const slotsLeft = item.slots - item.applied;
              const percentFilled = (item.applied / item.slots) * 100;

              return (
                <motion.div key={item.id} variants={staggerItem}>
                  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColors[item.type] || 'bg-gray-100 text-gray-700'}`}>
                        {item.type}
                      </span>
                      <div className="flex items-center text-gray-400 text-xs">
                        <Clock size={14} className="mr-1" />
                        Deadline: {new Date(item.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <h3 className="font-semibold text-xl text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">{item.description}</p>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {item.requirements.map((req, i) => (
                          <span key={i} className="flex items-center text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full">
                            <CheckCircle size={12} className="mr-1 text-npp-blue" />
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 flex items-center">
                          <Users size={14} className="mr-1" />
                          {item.applied} / {item.slots} slots filled
                        </span>
                        <span className={`font-semibold ${slotsLeft <= 5 ? 'text-npp-red' : 'text-npp-blue'}`}>
                          {slotsLeft} left
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            percentFilled >= 90 ? 'bg-npp-red' : percentFilled >= 60 ? 'bg-npp-red' : 'bg-npp-blue'
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No opportunities found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

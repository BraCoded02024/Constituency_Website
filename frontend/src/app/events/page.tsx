'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { api } from '@/lib/api';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  image: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    api.events.getAll().then((d) => setEvents(d as EventItem[])).catch(() => {});
  }, []);

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  const typeColors: Record<string, string> = {
    Meeting: 'bg-blue-100 text-blue-700',
    Celebration: 'bg-purple-100 text-purple-700',
    Summit: 'bg-green-100 text-green-700',
    Workshop: 'bg-orange-100 text-orange-700',
  };

  const renderEventCard = (event: EventItem) => (
    <motion.div key={event.id} variants={staggerItem}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:-translate-y-1 h-full flex flex-col">
        <div className="h-52 overflow-hidden relative">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColors[event.type] || 'bg-gray-100 text-gray-700'}`}>
              {event.type}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 bg-white rounded-xl p-3 shadow-lg text-center min-w-[60px]">
            <p className="text-ghana-red font-bold text-xl leading-none">
              {new Date(event.date).getDate()}
            </p>
            <p className="text-gray-500 text-xs font-medium uppercase">
              {new Date(event.date).toLocaleDateString('en-GB', { month: 'short' })}
            </p>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-semibold text-xl text-ghana-black mb-2 group-hover:text-ghana-green transition-colors">
            {event.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">{event.description}</p>
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <Clock size={14} className="mr-2 text-ghana-green" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin size={14} className="mr-2 text-ghana-green" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Stay informed about upcoming community events, meetings, and celebrations"
        icon={CalendarDays}
      />

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Upcoming Events */}
          {upcoming.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-ghana-black mb-6 flex items-center">
                <div className="w-3 h-3 bg-ghana-green rounded-full mr-3 animate-pulse" />
                Upcoming Events
              </h2>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {upcoming.map(renderEventCard)}
              </motion.div>
            </div>
          )}

          {/* Past Events */}
          {past.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-400 mb-6">Past Events</h2>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75"
              >
                {past.map(renderEventCard)}
              </motion.div>
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center py-20">
              <CalendarDays size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No events scheduled at this time.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { api } from '@/lib/api';

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
}

const categories = ['All', 'Infrastructure', 'Health', 'Education', 'Governance', 'Water & Sanitation', 'Events'];

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    api.gallery.getAll().then((d) => setGallery(d as GalleryItem[])).catch(() => {});
  }, []);

  const filtered = filter === 'All' ? gallery : gallery.filter((g) => g.category === filter);

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Explore photos from constituency events, projects, and community activities"
        icon={ImageIcon}
      />

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
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

          {/* Gallery Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                variants={staggerItem}
                layout
                onClick={() => setSelected(item)}
                className="cursor-pointer"
              >
                <div className="relative group rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-xl transition-all duration-300">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-white/70 text-xs mt-1">{item.category}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <ImageIcon size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No photos found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selected.image}
                alt={selected.title}
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
              <div className="mt-4 text-center">
                <h3 className="text-white text-xl font-semibold">{selected.title}</h3>
                <p className="text-white/60 text-sm mt-1">
                  {selected.category} &middot;{' '}
                  {new Date(selected.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

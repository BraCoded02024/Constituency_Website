'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';
import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
}

export default function PageHeader({ title, subtitle, icon: Icon }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-npp-blue to-npp-blue-dark text-white py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-npp-red rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-npp-red rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center">
          {Icon && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <Icon size={32} className="text-npp-red" />
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 tracking-tight">{title}</h1>
          <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
          <div className="npp-accent-bar" />
        </motion.div>
      </div>
    </div>
  );
}

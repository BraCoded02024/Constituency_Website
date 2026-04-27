'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Megaphone,
  Briefcase,
  FolderKanban,
  CalendarDays,
  UserPlus,
  MessageSquareWarning,
  User,
  Image,
  LayoutDashboard,
  Landmark,
} from 'lucide-react';
import { demoContent } from '@/lib/demoContent';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/about', label: demoContent.nav.aboutLinkLabel, icon: User },
  { href: '/gallery', label: 'Gallery', icon: Image },
];

const actionLinks = [
  { href: '/register', label: 'Join updates', icon: UserPlus },
  { href: '/concerns', label: 'Share Concern', icon: MessageSquareWarning },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-ghana-green shadow-lg sticky top-0 z-50">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-ghana-red via-ghana-gold to-ghana-green" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 group"
            aria-label={`${demoContent.constituency.name} — ${demoContent.badges.system}`}
          >
            <div className="w-10 h-10 bg-ghana-gold rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Landmark size={22} className="text-ghana-green" strokeWidth={2} aria-hidden />
            </div>
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <div>
                <p className="text-white font-bold text-lg leading-tight">{demoContent.constituency.name}</p>
                <p className="text-ghana-gold text-xs">{demoContent.office.navTagline}</p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/55 border border-white/25 rounded px-2 py-0.5">
                {demoContent.badges.mode}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                  isActive(link.href)
                    ? 'bg-white/20 text-ghana-gold'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <link.icon size={16} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              href="/register"
              title="Join the constituency updates"
              className="bg-ghana-gold text-ghana-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-ghana-gold-dark transition-colors shadow-md"
            >
              Join updates
            </Link>
            <Link
              href="/admin/login"
              className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center space-x-1.5"
            >
              <LayoutDashboard size={16} />
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-ghana-green-dark border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-white/20 text-ghana-gold'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <link.icon size={18} />
                  <span>{link.label}</span>
                </Link>
              ))}

              <div className="border-t border-white/10 my-2 pt-2">
                {actionLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-white/20 text-ghana-gold'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                ))}
                <Link
                  href="/admin/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium text-ghana-gold hover:bg-white/10 transition-colors"
                >
                  <LayoutDashboard size={18} />
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

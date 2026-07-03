'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NPP_FLAG_SRC } from '@/lib/siteImages';
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
  Image as ImageIcon,
  LayoutDashboard,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { demoContent } from '@/lib/demoContent';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/about', label: demoContent.nav.aboutLinkLabel, icon: User },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
];

const actionLinks = [
  { href: '/register', label: 'Join NPP', icon: UserPlus, accent: true },
  { href: '/concerns', label: 'Share Concern', icon: MessageSquareWarning, accent: false },
];

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const panelVariants = {
  closed: { x: '100%' },
  open: { x: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300, mass: 0.8 } },
};

const linkVariants = {
  closed: { opacity: 0, x: 20 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 + i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-npp-blue shadow-lg sticky top-0 z-50">
      <div className="h-1 bg-gradient-to-r from-npp-red via-white to-npp-blue" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center space-x-3 group relative z-[60]"
            aria-label={`${demoContent.constituency.name} — ${demoContent.office.navTagline}`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-md group-hover:scale-105 transition-transform bg-white flex items-center justify-center">
              <Image
                src={NPP_FLAG_SRC}
                alt="NPP Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
                loading="eager"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-lg leading-tight">{demoContent.constituency.name}</p>
              <p className="text-npp-red-light text-xs">{demoContent.office.navTagline}</p>
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
                    ? 'bg-white/20 text-npp-red-light'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <link.icon size={16} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              href="/register"
              title="Join the party"
              className="bg-npp-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-npp-red-dark transition-colors shadow-md"
            >
              Join NPP
            </Link>
            <Link
              href="/admin/login"
              className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center space-x-1.5"
            >
              <LayoutDashboard size={16} />
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative z-[60] w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="relative w-[22px] h-[22px]">
              <Menu
                size={22}
                className={`absolute inset-0 transition-all duration-200 ${isOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`}
              />
              <X
                size={22}
                className={`absolute inset-0 transition-all duration-200 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ── Mobile Full-Screen Menu ── */}
      {mounted && (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-in panel */}
            <motion.div
              variants={panelVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 z-[58] h-full w-[85vw] max-w-[340px] bg-gradient-to-b from-npp-blue-dark to-[#001a5e] lg:hidden flex flex-col shadow-2xl"
            >
              {/* Panel header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex items-center justify-center shadow">
                  <Image src={NPP_FLAG_SRC} alt="NPP" width={36} height={36} className="w-9 h-9 object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-tight truncate">{demoContent.constituency.name}</p>
                  <p className="text-npp-red-light text-[10px] font-medium">{demoContent.office.navTagline}</p>
                </div>
              </div>

              <div className="h-px bg-white/10 mx-5" />

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
                {navLinks.map((link, i) => {
                  const active = isActive(link.href);
                  return (
                    <motion.div key={link.href} custom={i} variants={linkVariants} initial="closed" animate="open">
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'bg-npp-red text-white shadow-lg shadow-npp-red/20'
                            : 'text-white/80 hover:bg-white/8 hover:text-white active:bg-white/12'
                        }`}
                      >
                        <link.icon size={18} className="shrink-0" />
                        <span className="flex-1">{link.label}</span>
                        {active && <ChevronRight size={14} className="opacity-60" />}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="h-px bg-white/10 my-1.5" />

                {actionLinks.map((link, i) => (
                  <motion.div key={link.href} custom={navLinks.length + i} variants={linkVariants} initial="closed" animate="open">
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        link.accent
                          ? 'bg-npp-red/15 text-npp-red-light hover:bg-npp-red/25 border border-npp-red/20'
                          : 'text-white/80 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <link.icon size={18} className="shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      <ArrowUpRight size={14} className="opacity-40" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="h-1 bg-gradient-to-r from-npp-red via-white to-npp-blue" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      )}
    </nav>
  );
}

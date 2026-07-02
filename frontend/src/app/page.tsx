'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FolderKanban,
  Briefcase,
  ArrowRight,
  UserPlus,
  MessageSquareWarning,
  HandHeart,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Shield,
  CheckCircle,
  Quote,
  X,
  User,
  Calendar,
  Megaphone,
  LayoutGrid,
} from 'lucide-react';
import { api } from '@/lib/api';
import { demoContent, operationModules } from '@/lib/demoContent';
import { seedAnnouncements, seedProjects, seedSuccessStories } from '@/lib/seedContent';
import SafeImage from '@/components/SafeImage';
import heroElephant from '@/assets/npp-hero-elephant.png';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  image: string;
  urgent: boolean;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: string;
  category: string;
  image?: string | null;
  budget?: string;
  startDate?: string;
  endDate?: string;
  contractor?: string;
}

interface SuccessStory {
  id: string;
  name: string;
  story: string;
  image: string;
  year: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

const stats = [
  { label: 'Party Members', value: '25,000+', icon: Users, color: 'bg-npp-blue' },
  { label: 'Projects Delivered', value: '45+', icon: FolderKanban, color: 'bg-npp-red' },
  { label: 'Communities Reached', value: '32', icon: TrendingUp, color: 'bg-npp-blue-light' },
  { label: 'Concerns Resolved', value: '1,200+', icon: CheckCircle, color: 'bg-npp-red-dark' },
];

const quickLinks = [
  { title: 'Get Updates', description: 'Sign up for constituency news, events, and programme alerts.', icon: UserPlus, href: '/register', color: 'text-npp-blue', bg: 'bg-npp-blue/10' },
  { title: 'Share Concern', description: 'Report issues or raise community matters directly to the office.', icon: MessageSquareWarning, href: '/concerns', color: 'text-npp-red', bg: 'bg-npp-red/10' },
  { title: 'Volunteer', description: 'Make a difference in communities across Suynani East.', icon: HandHeart, href: '/volunteer', color: 'text-npp-blue-dark', bg: 'bg-npp-blue/10' },
  { title: 'Opportunities', description: 'Explore training, grants, and empowerment programmes.', icon: Briefcase, href: '/opportunities', color: 'text-npp-red-dark', bg: 'bg-npp-red/10' },
];

function sectionFade(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: 'easeOut' as const } },
    viewport: { once: true, amount: 0.15 },
  };
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.announcements.getAll(),
      api.projects.getAll(),
      api.gallery.getStories(),
      api.services.getAll(),
    ]).then(([annRes, projRes, storyRes, svcRes]) => {
      const ann = annRes.status === 'fulfilled' && Array.isArray(annRes.value) && annRes.value.length > 0
        ? (annRes.value as Announcement[]).slice(0, 12)
        : [...seedAnnouncements];
      const proj = projRes.status === 'fulfilled' && Array.isArray(projRes.value) && projRes.value.length > 0
        ? (projRes.value as Project[]).slice(0, 12)
        : [...seedProjects];
      const story = storyRes.status === 'fulfilled' && Array.isArray(storyRes.value) && storyRes.value.length > 0
        ? (storyRes.value as SuccessStory[])
        : [...seedSuccessStories];
      const svc = svcRes.status === 'fulfilled' && Array.isArray(svcRes.value)
        ? (svcRes.value as Service[])
        : [];

      setAnnouncements(ann);
      setProjects(proj);
      setStories(story);
      setServices(svc);
      setContentReady(true);
    });
  }, []);

  return (
    <div className="bg-gray-50">
      <HeroSection />
      <ServicesSection services={services} />
      <NewsSection data={announcements} ready={contentReady} />
      <ProjectsSection data={projects} ready={contentReady} />
      <ConnectSection stories={stories} />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#001233]">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-npp-blue-dark via-npp-blue to-[#000d28]" />
        <div className="absolute top-0 right-0 w-[min(80vw,520px)] h-[min(80vw,520px)] bg-npp-red/15 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-npp-blue-light/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        <div
          className="hero-glow absolute bottom-[18%] left-1/2 w-[min(90vw,560px)] h-32 bg-npp-red/40 rounded-full blur-[80px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Mobile: elephant-first cinematic stack ── */}
        <div className="lg:hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative -mx-4 sm:-mx-6 h-[min(52vh,420px)]"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 h-full w-full"
            >
              <Image
                src={heroElephant}
                alt="NPP elephant carrying Ghana — strength for the nation"
                fill
                priority
                className="object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                sizes="100vw"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#001233] via-[#001233]/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#001233] to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="-mt-6 relative z-10 pb-6"
          >
            <HeroCopy compact />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            className="pb-10"
          >
            <HeroOpsPanel />
          </motion.div>
        </div>

        {/* ── Desktop: split layout ── */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 lg:items-end lg:min-h-[min(88vh,780px)] lg:pt-10 lg:pb-6">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="lg:col-span-5 pb-12 self-center"
          >
            <HeroCopy />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            className="lg:col-span-7 relative h-[min(72vh,620px)]"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 h-full w-full"
            >
              <Image
                src={heroElephant}
                alt="NPP elephant carrying Ghana — strength for the nation"
                fill
                priority
                className="object-contain object-bottom drop-shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-12 lg:-mt-28 lg:flex lg:justify-end relative z-20 pb-12"
          >
            <HeroOpsPanel />
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 h-1 bg-gradient-to-r from-npp-red via-white to-npp-blue" />
    </section>
  );
}

function HeroCopy({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="hero-badge-shimmer inline-flex items-center gap-2 border border-white/15 backdrop-blur-md px-3 py-1.5 rounded-full mb-4">
        <Shield size={13} className="text-npp-red-light shrink-0" />
        <span className="text-white/90 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase">
          {demoContent.platform.tagline}
        </span>
      </div>

      <h1 className={`font-extrabold text-white leading-[1.08] tracking-tight ${compact ? 'text-[1.75rem] sm:text-4xl' : 'text-4xl xl:text-[3.25rem]'}`}>
        <span className="text-npp-red-light">{demoContent.constituency.name}</span>
      </h1>

      <p className={`text-npp-red-light/90 font-medium tracking-wide uppercase ${compact ? 'text-[10px] mt-1.5' : 'text-xs mt-2'}`}>
        {demoContent.platform.operationsTagline}
      </p>

      {!compact && (
        <p className="mt-4 text-white/55 text-base max-w-md leading-relaxed hidden lg:block">
          {demoContent.platform.welcomeShort}
        </p>
      )}

      <div className={`flex gap-2.5 ${compact ? 'mt-5' : 'mt-7'}`}>
        <Link
          href="/register"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-npp-red text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-npp-red-dark transition-all shadow-lg shadow-npp-red/25 text-sm"
        >
          <UserPlus size={16} className="shrink-0" />
          Get Updates
        </Link>
        <Link
          href="/concerns"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/18 transition-all border border-white/20 text-sm"
        >
          <MessageSquareWarning size={16} />
          Share Concern
        </Link>
      </div>
    </>
  );
}

const MODULE_ICONS: Record<string, typeof Users> = {
  Projects: FolderKanban,
  Concerns: MessageSquareWarning,
  Events: Calendar,
  Announcements: Megaphone,
  Volunteers: HandHeart,
};

function HeroOpsPanel() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto lg:ml-auto lg:mr-0">
      <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-npp-red/90 to-npp-red px-5 py-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/20 ring-2 ring-white/30 shrink-0">
            <Image src="/images/npp-flag.png" alt="NPP" width={44} height={44} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{demoContent.platform.name}</p>
            <p className="text-white/75 text-[11px]">{demoContent.platform.operationsTagline}</p>
          </div>
          <LayoutGrid size={18} className="text-white/60 ml-auto shrink-0" />
        </div>

        <div className="p-4 grid grid-cols-2 gap-2.5">
          {operationModules.map((mod, index) => {
            const Icon = MODULE_ICONS[mod.label] || Briefcase;
            const isLastAlone = operationModules.length % 2 === 1 && index === operationModules.length - 1;
            return (
              <Link
                key={mod.label}
                href={mod.href}
                className={`group rounded-xl bg-white/95 p-3 hover:bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg border border-white/50 ${
                  isLastAlone ? 'col-span-2 w-[calc(50%-0.3125rem)] justify-self-center' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-npp-blue/10 flex items-center justify-center mb-2 group-hover:bg-npp-blue transition-colors">
                  <Icon size={16} className="text-npp-blue group-hover:text-white" />
                </div>
                <p className="text-gray-900 font-semibold text-xs">{mod.label}</p>
                <p className="text-gray-500 text-[10px] leading-snug mt-0.5 line-clamp-2">{mod.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Members', value: '25K+' },
            { label: 'Projects', value: '12' },
            { label: 'Resolved', value: '1.2K' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-black/20 px-2 py-2 text-center border border-white/10">
              <p className="text-white font-bold text-sm tabular-nums">{s.value}</p>
              <p className="text-white/55 text-[9px] uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesSection({ services: apiServices }: { services: Service[] }) {
  return (
    <section className="py-14 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionFade(0)} className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-12 lg:mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 lg:p-6 rounded-2xl npp-card hover:-translate-y-0.5 transition-all group">
              <div className={`w-12 h-12 lg:w-14 lg:h-14 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} className="text-white" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div {...sectionFade(0.1)}>
          <div className="text-center mb-8 lg:mb-10">
            <span className="npp-eyebrow">What We Offer</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">Quick Actions & Services</h2>
            <div className="npp-accent-bar" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {quickLinks.map((s) => (
              <Link key={s.title} href={s.href} className="block group">
                <div className="bg-gray-50 rounded-xl p-5 lg:p-6 npp-card hover:-translate-y-1 transition-all h-full">
                  <div className={`w-11 h-11 lg:w-12 lg:h-12 ${s.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>
                  <span className={`${s.color} text-xs font-medium flex items-center mt-3`}>
                    Get Started <ChevronRight size={14} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {apiServices.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {apiServices.slice(0, 6).map((svc) => (
                <div key={svc.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-npp-blue/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-npp-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{svc.title}</p>
                    <p className="text-xs text-gray-500 truncate">{svc.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function NewsSection({ data, ready }: { data: Announcement[]; ready: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const scrollCarousel = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const delta = Math.min(el.clientWidth * 0.72, 320);
    el.scrollBy({ left: dir * delta, behavior: 'smooth' });
  };

  return (
    <section className="py-14 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionFade(0)} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-10">
          <div>
            <span className="text-npp-blue font-semibold text-xs uppercase tracking-wider">Stay Informed</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">Latest Announcements</h2>
            <p className="text-gray-500 text-sm mt-2">Official updates from the Suynani East constituency office.</p>
          </div>
          <Link href="/announcements" className="inline-flex items-center text-npp-blue font-medium text-sm hover:underline shrink-0">
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </motion.div>

        {!ready ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-gray-200/80 animate-pulse" />
            ))}
          </div>
        ) : data.length > 0 ? (
          <motion.div {...sectionFade(0.1)} className="relative">
            <button
              type="button"
              aria-label="Previous announcements"
              onClick={() => scrollCarousel(-1)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-npp-blue hover:bg-npp-blue hover:text-white hover:border-npp-blue transition-colors -ml-5"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Next announcements"
              onClick={() => scrollCarousel(1)}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-npp-blue hover:bg-npp-blue hover:text-white hover:border-npp-blue transition-colors -mr-5"
            >
              <ChevronRight size={22} />
            </button>

            <div
              ref={scroller}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-8"
            >
              {data.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModal(item)}
                  className="snap-start shrink-0 w-[min(88vw,320px)] sm:w-80 text-left bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:-translate-y-1 hover:border-npp-blue/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-npp-blue focus-visible:ring-offset-2"
                >
                  <div className="h-44 overflow-hidden relative">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      category={item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      placeholderClassName="w-full h-full"
                    />
                    {item.urgent && <div className="absolute top-2 left-2 bg-npp-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">URGENT</div>}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-npp-blue text-[10px] font-semibold px-2 py-0.5 rounded-full">{item.category}</div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-400 text-xs mb-1.5">{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <h3 className="font-semibold text-gray-900 text-base mb-2 group-hover:text-npp-blue transition-colors line-clamp-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">{item.content}</p>
                    <span className="inline-flex items-center text-npp-blue text-xs font-medium mt-3">Read more</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16 text-gray-400"><p className="text-sm">Announcements will appear here soon.</p></div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative bg-white rounded-2xl max-w-lg w-full max-h-[min(90vh,640px)] overflow-hidden shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModal(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="h-48 sm:h-56 relative shrink-0">
                <SafeImage
                  src={modal.image}
                  alt={modal.title}
                  category={modal.category}
                  className="w-full h-full object-cover"
                  placeholderClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                {modal.urgent && <span className="absolute top-3 left-3 bg-npp-red text-white text-[10px] font-bold px-2 py-1 rounded-full">URGENT</span>}
                <span className="absolute bottom-3 left-3 text-white text-[11px] font-semibold bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">{modal.category}</span>
              </div>
              <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(min(90vh,640px)-12rem)]">
                <p className="text-gray-400 text-xs mb-2">{new Date(modal.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-4">{modal.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{modal.content}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ProjectsSection({ data, ready }: { data: Project[]; ready: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<Project | null>(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const scrollCarousel = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const delta = Math.min(el.clientWidth * 0.72, 340);
    el.scrollBy({ left: dir * delta, behavior: 'smooth' });
  };

  return (
    <section className="py-14 sm:py-16 lg:py-20 bg-npp-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...sectionFade(0)} className="text-center mb-8 lg:mb-12">
          <span className="text-npp-red-light font-semibold text-xs uppercase tracking-wider">Development Tracker</span>
          <h2 className="text-2xl lg:text-3xl font-bold mt-1">Constituency Projects</h2>
          <p className="text-white/60 text-sm mt-3 max-w-lg mx-auto">Track progress on roads, schools, healthcare, and community infrastructure across Suynani East.</p>
        </motion.div>

        {!ready ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : data.length > 0 ? (
          <motion.div {...sectionFade(0.1)} className="relative mb-8">
            <button
              type="button"
              aria-label="Previous projects"
              onClick={() => scrollCarousel(-1)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/95 border border-white text-npp-blue shadow-lg hover:bg-npp-red hover:text-white transition-colors -ml-5"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Next projects"
              onClick={() => scrollCarousel(1)}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/95 border border-white text-npp-blue shadow-lg hover:bg-npp-red hover:text-white transition-colors -mr-5"
            >
              <ChevronRight size={22} />
            </button>

            <div
              ref={scroller}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-8"
            >
              {data.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setModal(p)}
                  className="snap-start shrink-0 w-[min(88vw,320px)] sm:w-80 text-left rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-md shadow-lg hover:bg-white/[0.12] hover:border-white/30 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-npp-red focus-visible:ring-offset-2 focus-visible:ring-offset-npp-blue"
                >
                  <div className="p-3 pb-0">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-white/20 bg-black/20">
                      {p.image ? (
                        <>
                          <SafeImage
                            src={p.image}
                            alt={p.title}
                            category={p.category}
                            className="absolute inset-0 w-full h-full object-cover"
                            placeholderClassName="absolute inset-0 w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 pt-8">
                            <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{p.title}</p>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/35 p-4">
                          <FolderKanban size={32} strokeWidth={1.25} className="mb-1 opacity-80" />
                          <span className="text-[10px] font-medium uppercase tracking-wider">{p.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 pt-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-npp-red-light text-[10px] font-semibold bg-black/20 px-2 py-0.5 rounded-md border border-npp-red/20 truncate max-w-[55%]">
                        {p.category}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                          p.status === 'Completed'
                            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/20'
                            : p.status === 'In Progress'
                              ? 'bg-amber-500/25 text-amber-100 border border-amber-400/20'
                              : 'bg-sky-500/25 text-sky-100 border border-sky-400/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    {!p.image && <h3 className="font-semibold text-sm text-white mb-2 line-clamp-2">{p.title}</h3>}
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-xs text-white/55">
                        <span>Progress</span>
                        <span className="font-bold text-npp-red-light tabular-nums">{p.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden ring-1 ring-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${p.progress === 100 ? 'bg-emerald-400' : 'bg-npp-red'}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16 text-white/40"><p className="text-sm">Projects will appear here soon.</p></div>
        )}

        <motion.div {...sectionFade(0.2)} className="text-center">
          <Link href="/projects" className="inline-flex items-center bg-npp-red text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-npp-red-dark transition-colors">
            View All Projects <ArrowRight size={16} className="ml-2" />
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative bg-white rounded-2xl max-w-lg w-full max-h-[min(90vh,680px)] overflow-hidden shadow-2xl border border-gray-100 text-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModal(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
              {modal.image ? (
                <div className="h-48 sm:h-52 relative shrink-0">
                  <SafeImage
                    src={modal.image}
                    alt={modal.title}
                    category={modal.category}
                    className="w-full h-full object-cover"
                    placeholderClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-npp-blue/15 to-npp-red/10 flex items-center justify-center">
                  <FolderKanban size={40} className="text-npp-blue/40" />
                </div>
              )}
              <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(min(90vh,680px)-11rem)]">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-npp-blue/10 text-npp-blue border border-npp-blue/15">{modal.category}</span>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200">{modal.status}</span>
                </div>
                <h3 className="text-xl font-bold leading-snug mb-3">{modal.title}</h3>
                {modal.description && (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mb-5">{modal.description}</p>
                )}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-npp-blue">{modal.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-npp-blue transition-all" style={{ width: `${modal.progress}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-4">
                  {modal.budget && (
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">Budget</p>
                      <p className="font-semibold text-gray-900">{modal.budget}</p>
                    </div>
                  )}
                  {modal.contractor && (
                    <div className="col-span-2">
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">Contractor</p>
                      <p className="font-semibold text-gray-900">{modal.contractor}</p>
                    </div>
                  )}
                  {modal.startDate && (
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">Start</p>
                      <p className="font-semibold text-gray-900">{new Date(modal.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                  {modal.endDate && (
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">End</p>
                      <p className="font-semibold text-gray-900">{new Date(modal.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ConnectSection({ stories }: { stories: SuccessStory[] }) {
  return (
    <>
      <section className="py-14 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...sectionFade(0)} className="text-center mb-8 lg:mb-12">
            <span className="npp-eyebrow">Impact Stories</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">Success Stories</h2>
            <div className="npp-accent-bar" />
            <p className="text-gray-500 text-sm mt-4 max-w-xl mx-auto">Real outcomes from programmes and projects across the constituency.</p>
          </motion.div>

          {stories.length > 0 ? (
            <motion.div {...sectionFade(0.1)} className="grid md:grid-cols-3 gap-5 lg:gap-6">
              {stories.map((story) => (
                <div key={story.id} className="npp-card p-6 hover:-translate-y-1 transition-all flex flex-col h-full">
                  <Quote size={24} className="text-npp-red/30 mb-3" />
                  <p className="text-gray-600 text-sm leading-relaxed flex-1 italic">&ldquo;{story.story}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-npp-blue/12 flex items-center justify-center shrink-0" aria-hidden>
                      <User size={18} className="text-npp-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{story.name}</p>
                      <p className="text-gray-400 text-xs">Beneficiary, {story.year}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">Success stories will appear here soon.</p>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-npp-blue-dark to-npp-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <motion.div {...sectionFade(0)} className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3">Get Involved Today</h2>
              <p className="text-white/75 text-sm sm:text-base max-w-md leading-relaxed">
                Join NPP Suynani East programmes — volunteer with your community, explore opportunities, or stay informed on constituency development.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
              <Link href="/register" className="bg-npp-red text-white px-6 py-3 rounded-xl font-semibold hover:bg-npp-red-dark transition-all text-center text-sm">
                Get Updates
              </Link>
              <Link href="/volunteer" className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 text-center text-sm">
                Become a Volunteer
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

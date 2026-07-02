'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  ChevronUp,
  X,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { demoContent } from '@/lib/demoContent';
import { seedAnnouncements, seedProjects, seedSuccessStories } from '@/lib/seedContent';
import MpDemoProfileFigure from '@/components/MpDemoProfileFigure';
import SafeImage from '@/components/SafeImage';

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
  { title: 'Join the Party', description: 'Register as an NPP member and stay informed about party activities.', icon: UserPlus, href: '/register', color: 'text-npp-blue', bg: 'bg-npp-blue/10' },
  { title: 'Share Concern', description: 'Report issues or raise community matters directly to the party.', icon: MessageSquareWarning, href: '/concerns', color: 'text-npp-red', bg: 'bg-npp-red/10' },
  { title: 'Volunteer', description: 'Make a difference in communities across the constituency.', icon: HandHeart, href: '/volunteer', color: 'text-npp-blue-dark', bg: 'bg-npp-blue/10' },
  { title: 'Opportunities', description: 'Explore training, grants, and empowerment programs.', icon: Briefcase, href: '/opportunities', color: 'text-npp-red-dark', bg: 'bg-npp-red/10' },
];

const SECTION_LABELS = ['Home', 'Services', 'News', 'Projects', 'Connect'];
const TOTAL = SECTION_LABELS.length;
const COOLDOWN = 900;

const pageVariants = {
  enter: (dir: number) => ({
    y: dir > 0 ? '100%' : '-100%',
    opacity: 0.4,
    scale: 0.92,
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    y: dir > 0 ? '-40%' : '40%',
    opacity: 0,
    scale: 0.88,
  }),
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.4, 0, 0.2, 1] as const,
  duration: 0.7,
};

function childFade(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: 'easeOut' as const } },
  };
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState(0);
  const [direction, setDirection] = useState(1);
  const busy = useRef(false);
  const touchY = useRef(0);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const go = useCallback(
    (dir: number) => {
      if (busy.current) return;
      const next = section + dir;
      if (next < 0 || next >= TOTAL) return;
      busy.current = true;
      setDirection(dir);
      setSection(next);
      setTimeout(() => { busy.current = false; }, COOLDOWN);
    },
    [section],
  );

  const jumpTo = useCallback(
    (idx: number) => {
      if (busy.current || idx === section) return;
      busy.current = true;
      setDirection(idx > section ? 1 : -1);
      setSection(idx);
      setTimeout(() => { busy.current = false; }, COOLDOWN);
    },
    [section],
  );

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 20) return;
      go(e.deltaY > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); };
  }, [go]);

  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
  };

  const pages = [
    <HeroSection key="hero" onNext={() => go(1)} />,
    <ServicesSection key="services" services={services} />,
    <NewsSection key="news" data={announcements} ready={contentReady} />,
    <ProjectsSection key="projects" data={projects} ready={contentReady} />,
    <ConnectSection key="connect" stories={stories} />,
  ];

  if (!mounted) {
    return (
      <div className="h-[calc(100dvh-65px)] w-full overflow-hidden relative bg-npp-blue" />
    );
  }

  return (
    <div
      className="h-[calc(100dvh-65px)] w-full overflow-hidden relative bg-gray-50"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <nav className="fixed right-3 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2.5">
        {SECTION_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => jumpTo(i)}
            className="group flex items-center justify-end gap-2"
            aria-label={`Go to ${label}`}
          >
            <span className={`text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${section === i ? 'opacity-100 text-npp-blue' : 'opacity-0 group-hover:opacity-100 text-gray-400'}`}>
              {label}
            </span>
            <span className={`block rounded-full transition-all duration-300 ${section === i ? 'w-3 h-3 bg-npp-red shadow-md shadow-npp-red/40' : 'w-2 h-2 bg-gray-300 group-hover:bg-npp-blue group-hover:scale-125'}`} />
          </button>
        ))}
      </nav>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 md:hidden">
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
          {section === 0 ? 'Swipe up to explore' : SECTION_LABELS[section]}
        </p>
        <div className="flex gap-1.5">
          {SECTION_LABELS.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              aria-label={`Go to ${SECTION_LABELS[i]}`}
              className={`rounded-full transition-all duration-300 ${section === i ? 'w-6 h-1.5 bg-npp-red' : 'w-1.5 h-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {section > 0 && (
        <button onClick={() => go(-1)} className="absolute top-3 left-1/2 -translate-x-1/2 z-50 text-gray-400 hover:text-npp-blue transition-colors">
          <ChevronUp size={22} />
        </button>
      )}
      {section < TOTAL - 1 && (
        <button onClick={() => go(1)} className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 text-gray-400 hover:text-npp-blue transition-colors hidden md:block">
          <ChevronDown size={22} />
        </button>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={section}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
          className="absolute inset-0"
        >
          {pages[section]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SECTION COMPONENTS                                                */
/* ═══════════════════════════════════════════════════════════════════ */

function HeroSection({ onNext }: { onNext: () => void }) {
  return (
    <section className="h-full w-full bg-npp-blue flex items-center overflow-y-auto lg:overflow-hidden relative [scrollbar-width:thin]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-npp-blue-dark via-npp-blue to-npp-blue-light opacity-90" />
        <div className="absolute top-10 right-10 lg:top-20 lg:right-20 w-72 lg:w-[500px] h-72 lg:h-[500px] bg-npp-red/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 lg:bottom-20 lg:left-20 w-56 lg:w-[400px] h-56 lg:h-[400px] bg-white/5 rounded-full blur-3xl" />
        {/* NPP flag wave decoration */}
        <div className="absolute -right-20 top-0 bottom-0 w-[600px] opacity-[0.08] pointer-events-none hidden lg:block">
          <Image src="/images/npp-flag.png" alt="" fill className="object-cover" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-6 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-12 items-center">
          <motion.div {...childFade(0)} className="lg:hidden flex justify-center order-first">
            <div className="relative w-[min(92vw,340px)] aspect-[3/4] max-h-[min(52dvh,420px)] rounded-2xl overflow-hidden border-4 border-npp-red/35 shadow-2xl ring-2 ring-white/10">
              <MpDemoProfileFigure variant="heroMobile" className="absolute inset-0 w-full h-full" />
            </div>
          </motion.div>

          <motion.div {...childFade(0.15)} className="order-2 lg:order-none">
            <div className="hidden lg:inline-flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3 lg:mb-6">
              <Shield size={14} className="text-npp-red-light mr-1.5" />
              <span className="text-white/90 text-xs font-medium">New Patriotic Party — Official Platform</span>
            </div>

            <p className="text-npp-red-light text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-center lg:text-left mb-1 lg:hidden">
              {demoContent.mp.heroEyebrowMobile}
            </p>

            <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-3 lg:mb-6 text-center lg:text-left">
              Development in <span className="text-npp-red-light">Freedom</span>{' '}
              <br className="hidden lg:block" aria-hidden="true" />
              Building a <span className="text-npp-red-light">Better</span> Ghana
            </h1>

            <p className="text-white/85 text-xs leading-relaxed text-center lg:text-left mx-auto lg:mx-0 mb-4 block sm:hidden max-w-xl">
              {demoContent.mp.welcomeShort}
            </p>
            <p className="text-white/85 text-xs sm:text-sm lg:text-lg mb-4 sm:mb-5 lg:mb-8 leading-relaxed max-w-xl text-center lg:text-left mx-auto lg:mx-0 hidden sm:block">
              {demoContent.mp.welcomeLong}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/register" className="bg-npp-red text-white px-5 sm:px-6 py-3 rounded-xl font-semibold hover:bg-npp-red-dark transition-all shadow-xl flex items-center justify-center gap-2 text-center text-sm sm:text-base leading-snug">
                <UserPlus size={18} className="shrink-0" /><span>Join the Party</span>
              </Link>
              <Link href="/concerns" className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center space-x-2">
                <MessageSquareWarning size={18} /><span>Share Concern</span>
              </Link>
            </div>
          </motion.div>

          <motion.div {...childFade(0.3)} className="hidden lg:block">
            <div className="relative">
              <div className="w-[400px] h-[480px] mx-auto relative rounded-3xl overflow-hidden shadow-2xl">
                <MpDemoProfileFigure variant="heroDesktop" className="w-full h-full" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pointer-events-none">
                  <p className="text-white font-bold text-xl">{demoContent.mp.displayName}</p>
                  <p className="text-npp-red-light text-sm">{demoContent.mp.profileSubtitle}</p>
                </div>
              </div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -right-4 top-16 bg-white rounded-xl shadow-xl p-3">
                <p className="text-npp-blue font-bold text-xs">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </motion.div>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute -left-4 bottom-28 bg-white rounded-xl shadow-xl p-3">
                <p className="text-npp-blue font-bold text-xs">Registered</p>
                <p className="text-2xl font-bold text-gray-900">25K+</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.button
        onClick={onNext}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 flex flex-col items-center cursor-pointer hover:text-white/70 transition-colors"
      >
        <span className="text-[10px] uppercase tracking-widest mb-1 md:hidden">Explore</span>
        <span className="text-[10px] uppercase tracking-widest mb-1 hidden md:inline">Scroll</span>
        <ChevronDown size={18} />
      </motion.button>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-npp-red via-white to-npp-blue" />
    </section>
  );
}

function ServicesSection({ services: apiServices }: { services: Service[] }) {
  return (
    <section className="h-full w-full bg-white flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        <motion.div {...childFade(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-5 mb-8 lg:mb-14">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 lg:p-5 rounded-2xl npp-card hover:-translate-y-0.5 transition-all group">
              <div className={`w-11 h-11 lg:w-14 lg:h-14 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} className="text-white" />
              </div>
              <p className="text-xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-500 text-[10px] lg:text-xs">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div {...childFade(0.2)}>
          <div className="text-center mb-5 lg:mb-8">
            <span className="npp-eyebrow">What We Offer</span>
            <h2 className="text-xl lg:text-3xl font-bold text-gray-900 mt-1">Quick Actions & Services</h2>
            <div className="npp-accent-bar" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-6">
            {quickLinks.map((s) => (
              <Link key={s.title} href={s.href} className="block group">
                <div className="bg-gray-50 rounded-xl p-4 lg:p-6 npp-card hover:-translate-y-1 transition-all h-full">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 ${s.bg} rounded-xl flex items-center justify-center mb-2 lg:mb-3 group-hover:scale-110 transition-transform`}>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-[11px] lg:text-xs leading-relaxed">{s.description}</p>
                  <span className={`${s.color} text-[11px] font-medium flex items-center mt-2`}>
                    Get Started <ChevronRight size={12} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {apiServices.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
              {apiServices.slice(0, 6).map((svc) => (
                <div key={svc.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-npp-blue/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={14} className="text-npp-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{svc.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{svc.category}</p>
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
    <section className="h-full w-full bg-gray-50 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        <motion.div {...childFade(0)}>
          <div className="flex items-center justify-between mb-6 lg:mb-10">
            <div>
              <span className="text-npp-blue font-semibold text-xs uppercase tracking-wider">Stay Informed</span>
              <h2 className="text-xl lg:text-3xl font-bold text-gray-900 mt-1">Latest Announcements</h2>
              <p className="text-gray-500 text-xs mt-1 hidden sm:block">Swipe or use arrows — tap a card to read the full notice.</p>
            </div>
            <Link href="/announcements" className="hidden sm:flex items-center text-npp-blue font-medium text-sm hover:underline">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </motion.div>

        {!ready ? (
          <div className="flex gap-4 overflow-hidden px-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="shrink-0 w-[min(88vw,300px)] h-64 rounded-2xl bg-gray-200/80 animate-pulse" />
            ))}
          </div>
        ) : data.length > 0 ? (
          <motion.div {...childFade(0.15)} className="relative">
            <button
              type="button"
              aria-label="Previous announcements"
              onClick={() => scrollCarousel(-1)}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-npp-blue hover:bg-npp-blue hover:text-white hover:border-npp-blue transition-colors -ml-2 lg:-ml-4"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Next announcements"
              onClick={() => scrollCarousel(1)}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-npp-blue hover:bg-npp-blue hover:text-white hover:border-npp-blue transition-colors -mr-2 lg:-mr-4"
            >
              <ChevronRight size={22} />
            </button>

            <div
              ref={scroller}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1 sm:px-12"
            >
              {data.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModal(item)}
                  className="snap-start shrink-0 w-[min(88vw,300px)] sm:w-72 text-left bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:-translate-y-1 hover:border-npp-blue/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-npp-blue focus-visible:ring-offset-2"
                >
                  <div className="h-36 lg:h-40 overflow-hidden relative">
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
                  <div className="p-4">
                    <p className="text-gray-400 text-[10px] mb-1">{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base mb-1 group-hover:text-npp-blue transition-colors line-clamp-2">{item.title}</h3>
                    <p className="text-gray-600 text-xs line-clamp-2">{item.content}</p>
                    <span className="inline-flex items-center text-npp-blue text-[11px] font-medium mt-2">Read more</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex sm:hidden justify-center gap-3 mt-2">
              <button type="button" aria-label="Previous" onClick={() => scrollCarousel(-1)} className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-npp-blue shadow-sm">
                <ChevronLeft size={20} />
              </button>
              <button type="button" aria-label="Next" onClick={() => scrollCarousel(1)} className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-npp-blue shadow-sm">
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16 text-gray-400"><p className="text-sm">Announcements will appear here soon.</p></div>
        )}

        <div className="text-center mt-5 sm:hidden">
          <Link href="/announcements" className="text-npp-blue font-medium inline-flex items-center text-sm">
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
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
    <section className="h-full w-full bg-npp-blue text-white flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        <motion.div {...childFade(0)}>
          <div className="text-center mb-6 lg:mb-10">
            <span className="text-npp-red-light font-semibold text-xs uppercase tracking-wider">Development Tracker</span>
            <h2 className="text-xl lg:text-3xl font-bold mt-1">Constituency Projects</h2>
            <p className="text-white/60 text-xs lg:text-sm mt-2 max-w-md mx-auto">Swipe or use arrows — tap a project for full details.</p>
          </div>
        </motion.div>

        {!ready ? (
          <div className="flex gap-4 overflow-hidden px-1 mb-6">
            {[0, 1].map((i) => (
              <div key={i} className="shrink-0 w-[min(88vw,300px)] h-72 rounded-2xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : data.length > 0 ? (
          <motion.div {...childFade(0.15)} className="relative mb-6 lg:mb-10">
            <button
              type="button"
              aria-label="Previous projects"
              onClick={() => scrollCarousel(-1)}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/95 border border-white text-npp-blue shadow-lg hover:bg-npp-red hover:text-white transition-colors -ml-2 lg:-ml-4"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Next projects"
              onClick={() => scrollCarousel(1)}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/95 border border-white text-npp-blue shadow-lg hover:bg-npp-red hover:text-white transition-colors -mr-2 lg:-mr-4"
            >
              <ChevronRight size={22} />
            </button>

            <div
              ref={scroller}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1 sm:px-12"
            >
              {data.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setModal(p)}
                  className="snap-start shrink-0 w-[min(88vw,300px)] sm:w-72 text-left rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-md shadow-lg shadow-black/10 hover:bg-white/[0.12] hover:border-white/30 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-npp-red focus-visible:ring-offset-2 focus-visible:ring-offset-npp-blue"
                >
                  <div className="p-3 pb-0">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-white/20 shadow-inner bg-black/20">
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
                            <p className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-sm">{p.title}</p>
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
                    {!p.image ? <h3 className="font-semibold text-sm text-white mb-2 line-clamp-2 leading-snug">{p.title}</h3> : null}
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-[11px] text-white/55">
                        <span>Progress</span>
                        <span className="font-bold text-npp-red-light tabular-nums">{p.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden ring-1 ring-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.progress}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                          className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-400' : 'bg-npp-red'}`}
                        />
                      </div>
                      <span className="inline-flex text-npp-red-light text-[11px] font-medium">View details</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex sm:hidden justify-center gap-3 mt-1">
              <button type="button" aria-label="Previous" onClick={() => scrollCarousel(-1)} className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white">
                <ChevronLeft size={20} />
              </button>
              <button type="button" aria-label="Next" onClick={() => scrollCarousel(1)} className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white">
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16 text-white/40"><p className="text-sm">Projects will appear here soon.</p></div>
        )}

        <motion.div {...childFade(0.3)} className="text-center">
          <Link href="/projects" className="inline-flex items-center bg-npp-red text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-npp-red-dark transition-colors">
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
                {modal.description ? (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mb-5">{modal.description}</p>
                ) : null}
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
                  {modal.budget ? (
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">Budget</p>
                      <p className="font-semibold text-gray-900">{modal.budget}</p>
                    </div>
                  ) : null}
                  {modal.contractor ? (
                    <div className="col-span-2">
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">Contractor</p>
                      <p className="font-semibold text-gray-900">{modal.contractor}</p>
                    </div>
                  ) : null}
                  {modal.startDate ? (
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">Start</p>
                      <p className="font-semibold text-gray-900">{new Date(modal.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  ) : null}
                  {modal.endDate ? (
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide text-[10px]">End</p>
                      <p className="font-semibold text-gray-900">{new Date(modal.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  ) : null}
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
    <section className="h-full w-full flex flex-col">
      <div className="flex-1 bg-gray-50 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
          <motion.div {...childFade(0)}>
            <div className="text-center mb-5 lg:mb-8">
              <span className="npp-eyebrow text-npp-red-light">Impact Stories</span>
              <h2 className="text-xl lg:text-3xl font-bold text-gray-900 mt-1">Success Stories</h2>
              <div className="npp-accent-bar" />
            </div>
          </motion.div>

          {stories.length > 0 && (
            <motion.div {...childFade(0.15)} className="grid md:grid-cols-3 gap-4 lg:gap-6">
              {stories.map((story) => (
                <div key={story.id} className="npp-card p-5 hover:-translate-y-1 transition-all flex flex-col">
                  <Quote size={24} className="text-npp-red/30 mb-2" />
                  <p className="text-gray-600 text-xs leading-relaxed flex-1 italic">&ldquo;{story.story}&rdquo;</p>
                  <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-npp-blue/12 flex items-center justify-center shrink-0" aria-hidden>
                      <User size={18} className="text-npp-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{story.name}</p>
                      <p className="text-gray-400 text-[10px]">Beneficiary, {story.year}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-npp-blue-dark to-npp-blue text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <motion.div {...childFade(0.1)} className="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold mb-2">Be Part of the Change</h2>
              <p className="text-white/70 text-sm max-w-md">Join the New Patriotic Party to be part of Ghana&apos;s development in freedom. Together, we build a stronger nation.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
              <Link href="/register" className="bg-npp-red text-white px-5 py-3 rounded-xl font-semibold hover:bg-npp-red-dark transition-all text-center text-xs sm:text-sm leading-snug">
                Join the Party
              </Link>
              <Link href="/volunteer" className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 text-center text-sm">
                Become a Volunteer
              </Link>
            </div>
          </motion.div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-white/50 text-[11px]">
            <span className="flex items-center gap-1"><MapPin size={12} /> {demoContent.constituency.mapLine}</span>
            <span className="flex items-center gap-1"><Phone size={12} /> {demoContent.contact.phoneDisplay}</span>
            <span className="flex items-center gap-1"><Mail size={12} /> {demoContent.contact.emailDisplay}</span>
            <span className="ml-auto text-white/40 text-[11px]" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} {demoContent.copyright.line}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

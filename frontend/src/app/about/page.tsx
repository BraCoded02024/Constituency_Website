'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  Target,
  Heart,
  Users,
  Building,
  Lightbulb,
  ArrowRight,
  Shield,
  LayoutGrid,
  UserCog,
  Megaphone,
  FolderKanban,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { fadeInUp, staggerContainer, staggerItem, slideInLeft, slideInRight } from '@/lib/motion';
import { demoContent, operationModules } from '@/lib/demoContent';

const achievements = [
  { value: '45+', label: 'Projects Completed', icon: Building },
  { value: '25,000+', label: 'Constituents Served', icon: Users },
  { value: '1,200+', label: 'Concerns Resolved', icon: Target },
  { value: '500+', label: 'Scholarships Awarded', icon: GraduationCap },
];

const priorities = [
  {
    title: 'Education & Youth Development',
    description: 'Investing in scholarships, school infrastructure, and ICT training to prepare our youth for the future.',
    icon: GraduationCap,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Infrastructure Development',
    description: 'Building and rehabilitating roads, bridges, and community facilities to improve quality of life.',
    icon: Building,
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Healthcare Access',
    description: 'Expanding healthcare services, organizing health screenings, and supporting NHIS enrollment.',
    icon: Heart,
    color: 'bg-red-50 text-red-600',
  },
  {
    title: 'Economic Empowerment',
    description: 'Creating opportunities through skills training, small business grants, and agricultural programs.',
    icon: Lightbulb,
    color: 'bg-yellow-50 text-yellow-600',
  },
];

const systemFeatures = [
  {
    title: 'Constituent Updates',
    description: 'Sign up for constituency news and stay connected with local initiatives.',
    icon: Users,
  },
  {
    title: 'Staff Roles & Privileges',
    description: 'Super admins assign module access — announcements, projects, events, and more.',
    icon: UserCog,
  },
  {
    title: 'Public Engagement',
    description: 'Announcements, events, concerns, and volunteer sign-ups connected to one backend.',
    icon: Megaphone,
  },
  {
    title: 'Project Transparency',
    description: 'Live progress tracking and budget visibility for constituency development work.',
    icon: FolderKanban,
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title={demoContent.about.pageTitle}
        subtitle={demoContent.about.pageSubtitle}
        icon={Shield}
      />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="relative">
                <div className="w-full max-w-md mx-auto rounded-3xl shadow-2xl overflow-hidden border border-gray-100 bg-gradient-to-br from-npp-blue to-npp-blue-dark p-6 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/15 ring-2 ring-white/25">
                      <Image src="/images/npp-flag.png" alt="NPP" width={56} height={56} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{demoContent.platform.name}</p>
                      <p className="text-white/70 text-sm">{demoContent.platform.tagline}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {operationModules.slice(0, 4).map((mod) => (
                      <div key={mod.label} className="rounded-xl bg-white/10 border border-white/15 p-3">
                        <p className="font-semibold text-sm">{mod.label}</p>
                        <p className="text-white/60 text-[11px] mt-0.5">{mod.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-white/70 text-xs">
                    <LayoutGrid size={14} />
                    <span>{operationModules.length} operational modules · role-based admin access</span>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-npp-red text-white p-5 rounded-2xl shadow-xl max-w-[220px] hidden md:block">
                  <Shield size={22} className="mb-2" />
                  <p className="font-semibold text-sm">{demoContent.about.platformTitle}</p>
                  <p className="text-white/75 text-xs mt-1">{demoContent.about.platformSubtitle}</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="text-npp-blue font-semibold text-sm uppercase tracking-wider">{demoContent.about.sectionEyebrow}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-2">{demoContent.about.platformTitle}</h2>
              <p className="text-npp-red font-medium text-sm mb-6">{demoContent.platform.operationsTagline}</p>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                {demoContent.about.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href="/concerns"
                  className="bg-npp-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-npp-blue-dark transition-colors flex items-center space-x-2"
                >
                  <span>Reach Out</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/projects"
                  className="bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  View Projects
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <span className="text-npp-blue font-semibold text-sm uppercase tracking-wider">System Capabilities</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">How the Platform Works</h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {systemFeatures.map((item) => (
              <motion.div key={item.title} variants={staggerItem}>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-full">
                  <div className="w-11 h-11 bg-npp-blue/10 rounded-xl flex items-center justify-center mb-3">
                    <item.icon size={22} className="text-npp-blue" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-npp-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {achievements.map((item) => (
              <motion.div key={item.label} variants={staggerItem} className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon size={28} className="text-npp-red" />
                </div>
                <p className="text-3xl font-bold mb-1">{item.value}</p>
                <p className="text-white/70 text-sm">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-npp-blue font-semibold text-sm uppercase tracking-wider">Focus Areas</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">Key Priorities</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our development agenda focuses on four key pillars that drive constituency growth and improve quality of life.</p>
            <div className="w-16 h-1 bg-npp-red mx-auto mt-4 rounded-full" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {priorities.map((item) => (
              <motion.div key={item.title} variants={staggerItem}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 h-full">
                  <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon size={24} />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-npp-blue font-semibold text-sm uppercase tracking-wider">Our Journey</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">Milestones</h2>
            <div className="w-16 h-1 bg-npp-red mx-auto mt-4 rounded-full" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="relative"
          >
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-npp-blue/20" />
            {demoContent.about.timeline.map((item) => (
              <motion.div key={`${item.year}-${item.event}`} variants={staggerItem} className="relative pl-20 pb-10 last:pb-0">
                <div className="absolute left-5 w-7 h-7 bg-npp-blue rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2.5 h-2.5 bg-npp-red rounded-full" />
                </div>
                <div className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <span className="text-npp-blue font-bold text-sm">{item.year}</span>
                  <h3 className="font-semibold text-lg text-gray-900 mt-1">{item.event}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.details}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}

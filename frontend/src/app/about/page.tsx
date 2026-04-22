'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  GraduationCap,
  Award,
  Target,
  Heart,
  Users,
  Building,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { fadeInUp, staggerContainer, staggerItem, slideInLeft, slideInRight } from '@/lib/motion';

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

const timeline = [
  { year: '2024', event: 'Elected as Member of Parliament', details: 'Won the Ayawaso West Wuogon constituency seat with a strong mandate from the people.' },
  { year: '2021', event: 'Launched Constituency Development Fund', details: 'Established a transparent fund for community development projects.' },
  { year: '2022', event: 'Completed 20 Borehole Projects', details: 'Provided clean water access to 20 underserved communities.' },
  { year: '2023', event: 'Education Scholarship Program', details: 'Awarded 200+ scholarships to students from SHS to university level.' },
  { year: '2024', event: 'Road Rehabilitation Phase 1', details: 'Completed first phase of constituency-wide road rehabilitation.' },
  { year: '2025', event: 'ICT Training Centers', details: 'Opened 3 community ICT centers with modern computer labs.' },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About the MP"
        subtitle="Learn about Hon. John Setor Dumelo, his vision, and commitment to Ayawaso West Wuogon"
        icon={User}
      />

      {/* MP Profile */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="relative">
                <img
                  src="/mp_image.png"
                  alt="Hon. Member of Parliament"
                  className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-ghana-green text-white p-6 rounded-2xl shadow-xl max-w-[200px] hidden md:block">
                  <Award size={24} className="text-ghana-gold mb-2" />
                  <p className="font-semibold text-sm">Member of Parliament</p>
                  <p className="text-white/70 text-xs mt-1">Ayawaso West Wuogon</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="text-ghana-green font-semibold text-sm uppercase tracking-wider">Meet Your Representative</span>
              <h2 className="text-3xl md:text-4xl font-bold text-ghana-black mt-2 mb-6">Hon. John Setor Dumelo</h2>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Hon. John Setor Dumelo is the Member of Parliament for Ayawaso West Wuogon Constituency. 
                  A passionate advocate for community development, he is committed to bridging the gap between 
                  government and the people, ensuring that every voice is heard and every community receives the 
                  resources needed for growth.
                </p>
                <p>
                  With a deep connection to the people of Ayawaso West Wuogon, Hon. Dumelo brings energy, vision, 
                  and a hands-on approach to serving the constituency. He believes in transparent governance, 
                  inclusive development, and empowering the youth to become future leaders.
                </p>
                <p>
                  Together, we can build a constituency that serves as a model of development, unity, and progress 
                  for the entire nation. Your concerns are his priority, and your aspirations drive his work in Parliament.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href="/concerns"
                  className="bg-ghana-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-ghana-green-dark transition-colors flex items-center space-x-2"
                >
                  <span>Reach Out</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/projects"
                  className="bg-gray-100 text-ghana-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  View Projects
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-ghana-green text-white">
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
                  <item.icon size={28} className="text-ghana-gold" />
                </div>
                <p className="text-3xl font-bold mb-1">{item.value}</p>
                <p className="text-white/70 text-sm">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Key Priorities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-ghana-green font-semibold text-sm uppercase tracking-wider">Focus Areas</span>
            <h2 className="text-3xl md:text-4xl font-bold text-ghana-black mt-2 mb-4">Key Priorities</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our development agenda focuses on four key pillars that drive constituency growth and improve quality of life.</p>
            <div className="w-16 h-1 bg-ghana-gold mx-auto mt-4 rounded-full" />
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
                  <h3 className="font-semibold text-lg text-ghana-black mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-ghana-green font-semibold text-sm uppercase tracking-wider">Our Journey</span>
            <h2 className="text-3xl md:text-4xl font-bold text-ghana-black mt-2 mb-4">Milestones</h2>
            <div className="w-16 h-1 bg-ghana-gold mx-auto mt-4 rounded-full" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="relative"
          >
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-ghana-green/20" />
            {timeline.map((item, index) => (
              <motion.div key={item.year} variants={staggerItem} className="relative pl-20 pb-10 last:pb-0">
                <div className="absolute left-5 w-7 h-7 bg-ghana-green rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2.5 h-2.5 bg-ghana-gold rounded-full" />
                </div>
                <div className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <span className="text-ghana-green font-bold text-sm">{item.year}</span>
                  <h3 className="font-semibold text-lg text-ghana-black mt-1">{item.event}</h3>
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

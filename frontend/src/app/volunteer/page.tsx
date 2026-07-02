'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HandHeart, CheckCircle, Heart, Users, CalendarDays, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import { api } from '@/lib/api';

const areas = ['Health Outreach', 'Education', 'Community Clean-up', 'Event Support', 'Youth Mentorship', 'General'];

const benefits = [
  { title: 'Make a Difference', description: 'Directly impact your community through meaningful service.', icon: Heart },
  { title: 'Build Networks', description: 'Connect with like-minded individuals and community leaders.', icon: Users },
  { title: 'Gain Experience', description: 'Develop leadership and organizational skills.', icon: Award },
  { title: 'Community Events', description: 'Be at the center of constituency activities and events.', icon: CalendarDays },
];

export default function VolunteerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    age: '',
    community: '',
    area: '',
    motivation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.area) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.volunteers.register(form);
      setSubmitted(true);
      toast.success('Volunteer registration successful!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <PageHeader title="Volunteer" subtitle="Join our team of change-makers" icon={HandHeart} />
        <div className="py-20 bg-gray-50">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-lg mx-auto text-center px-4">
            <div className="w-20 h-20 bg-npp-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-npp-blue" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to the Team!</h2>
            <p className="text-gray-600 mb-8">
              Thank you for volunteering, {form.fullName}! We are excited to have you on board.
              Our team will contact you with details about upcoming volunteer activities.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({ fullName: '', phone: '', email: '', age: '', community: '', area: '', motivation: '' }); }}
              className="bg-npp-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-npp-blue-dark transition-colors"
            >
              Register Another Volunteer
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Become a Volunteer"
        subtitle="Join a passionate team of community members making a difference in our constituency"
        icon={HandHeart}
      />

      {/* Benefits Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {benefits.map((item) => (
              <motion.div key={item.title} variants={staggerItem} className="text-center p-4">
                <div className="w-12 h-12 bg-npp-blue/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon size={22} className="text-npp-blue" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-npp-red/10 rounded-xl flex items-center justify-center mr-3">
                  <HandHeart size={20} className="text-npp-red-dark" />
                </div>
                Volunteer Application
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="e.g. 0241234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="Your age"
                    min="16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Area of Interest *</label>
                  <select
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="">Select area</option>
                    {areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Why do you want to volunteer?</label>
                  <textarea
                    name="motivation"
                    value={form.motivation}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none"
                    placeholder="Tell us what motivates you to volunteer..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full bg-npp-blue text-white py-4 rounded-xl font-semibold text-lg hover:bg-npp-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Submitting...' : 'Join as Volunteer'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}

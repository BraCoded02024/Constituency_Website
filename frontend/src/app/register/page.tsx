'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { fadeInUp } from '@/lib/motion';
import { api } from '@/lib/api';
import { demoContent } from '@/lib/demoContent';

const communities = [
  'Abokobi', 'Agbogba', 'Dome', 'Pantang', 'Haatso', 'Kwabenya',
  'Ashongman', 'Taifa', 'Sesemi', 'Boi', 'Other',
];

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    community: '',
    age: '',
    gender: '',
    occupation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.community || !form.gender) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.constituents.register(form);
      setSubmitted(true);
      toast.success('You\'re signed up for constituency updates!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not complete sign-up';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <PageHeader title={demoContent.register.successTitle} subtitle={demoContent.register.pageTitle} icon={UserPlus} />
        <div className="py-20 bg-gray-50">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-lg mx-auto text-center px-4">
            <div className="w-20 h-20 bg-npp-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-npp-blue" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">You&apos;re subscribed to updates!</h2>
            <p className="text-gray-600 mb-8">
              Thank you, {form.fullName}. You&apos;ll get constituency updates on programmes, events, and opportunities.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({ fullName: '', phone: '', email: '', community: '', age: '', gender: '', occupation: '' }); }}
              className="bg-npp-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-npp-blue-dark transition-colors"
            >
              Add another person
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={demoContent.register.pageTitle}
        subtitle={demoContent.register.pageSubtitle}
        icon={UserPlus}
      />

      <section className="py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-npp-blue/10 rounded-xl flex items-center justify-center mr-3">
                  <UserPlus size={20} className="text-npp-blue" />
                </div>
                Personal Information
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Community *</label>
                  <select
                    name="community"
                    value={form.community}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="">Select your community</option>
                    {communities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
                    min="18"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="e.g. Teacher, Trader, Farmer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full bg-npp-blue text-white py-4 rounded-xl font-semibold text-lg hover:bg-npp-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Saving...' : 'Join the constituency updates'}
              </button>

              <p className="text-center text-gray-400 text-xs mt-4">
                Your information is kept confidential and used only for constituency services.
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}

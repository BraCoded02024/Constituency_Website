'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareWarning, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { fadeInUp } from '@/lib/motion';
import { api } from '@/lib/api';

const categories = ['Infrastructure', 'Education', 'Health', 'Water & Sanitation', 'Security', 'Employment', 'Other'];
const communities = [
  'Abokobi', 'Agbogba', 'Dome', 'Pantang', 'Haatso', 'Kwabenya',
  'Ashongman', 'Taifa', 'Sesemi', 'Boi', 'Other',
];

export default function ConcernsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    community: '',
    category: '',
    subject: '',
    description: '',
    priority: 'Medium',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.community || !form.category || !form.subject || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.concerns.submit(form);
      setSubmitted(true);
      toast.success('Your concern was shared successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <PageHeader title="Share a Concern" subtitle="Report community issues directly" icon={MessageSquareWarning} />
        <div className="py-20 bg-gray-50">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-lg mx-auto text-center px-4">
            <div className="w-20 h-20 bg-ghana-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-ghana-green" />
            </div>
            <h2 className="text-2xl font-bold text-ghana-black mb-4">Concern shared!</h2>
            <p className="text-gray-600 mb-8">
              Thank you, {form.name}. Your concern about &ldquo;{form.subject}&rdquo; has been received.
              Our team will review it and take appropriate action. You may be contacted for follow-up.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', community: '', category: '', subject: '', description: '', priority: 'Medium' }); }}
              className="bg-ghana-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-ghana-green-dark transition-colors"
            >
              Share another concern
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Share a Concern"
        subtitle="Report infrastructure issues, request support, or raise community matters to the MP's office"
        icon={MessageSquareWarning}
      />

      <section className="py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            {/* Info Notice */}
            <div className="bg-ghana-gold/10 border border-ghana-gold/20 rounded-xl p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle size={20} className="text-ghana-gold-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-ghana-black">How it works</p>
                <p className="text-sm text-gray-600 mt-1">
                  Share your concern below. Our team will review and categorize it, then assign it for resolution.
                  You can track the status of your concern through our office.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-ghana-black mb-6 flex items-center">
                <div className="w-10 h-10 bg-ghana-red/10 rounded-xl flex items-center justify-center mr-3">
                  <MessageSquareWarning size={20} className="text-ghana-red" />
                </div>
                Concern Details
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="Enter your name"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Community *</label>
                  <select
                    name="community"
                    value={form.community}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="">Select community</option>
                    {communities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="Brief subject of your concern"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none"
                    placeholder="Describe your concern in detail. Include location, affected people, and any relevant information..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full bg-ghana-red text-white py-4 rounded-xl font-semibold text-lg hover:bg-ghana-red-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Sharing...' : 'Share Concern'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}

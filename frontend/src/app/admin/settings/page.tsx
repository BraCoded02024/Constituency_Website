'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2, User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      const user = JSON.parse(stored);
      setName(user.name);
      setEmail(user.email);
    }
  }, []);

  const handleUpdateProfile = async () => {
    if (!name || !email) { toast.error('Name and email required'); return; }
    setSaving(true);
    try {
      const updated = await api.auth.updateProfile({ name, email });
      localStorage.setItem('admin_user', JSON.stringify(updated));
      toast.success('Profile updated');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error('Fill in all password fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPassword(true);
    try {
      await api.auth.updateProfile({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSavingPassword(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <User size={16} className="text-ghana-green" />
          <h2 className="font-semibold text-sm text-gray-900">Profile Information</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
          </div>
          <button onClick={handleUpdateProfile} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-ghana-green text-white rounded-xl text-sm font-medium hover:bg-ghana-green/90 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Lock size={16} className="text-orange-500" />
          <h2 className="font-semibold text-sm text-gray-900">Change Password</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-ghana-green outline-none" />
          </div>
          <button onClick={handleChangePassword} disabled={savingPassword} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
            {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}

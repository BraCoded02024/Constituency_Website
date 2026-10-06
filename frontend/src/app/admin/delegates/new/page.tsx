'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import DelegateFormFields from '@/components/admin/DelegateFormFields';
import {
  emptyDelegateForm,
  formToPayload,
  validateDelegateForm,
  type DelegateFormState,
} from '@/lib/delegateTypes';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewDelegatePage() {
  const router = useRouter();
  const [form, setForm] = useState<DelegateFormState>(emptyDelegateForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateDelegateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error('Fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const created = await api.delegates.create(formToPayload(form)) as { id: string };
      toast.success('Delegate created');
      router.push(`/admin/delegates/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/delegates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-npp-blue">
        <ArrowLeft size={16} /> Back to delegates
      </Link>
      <h1 className="text-xl font-bold text-gray-900">Add Delegate</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <DelegateFormFields form={form} errors={errors} onChange={setForm} />
        <div className="flex justify-end gap-2">
          <Link href="/admin/delegates" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save Delegate
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import DelegateFormFields from '@/components/admin/DelegateFormFields';
import {
  delegateToForm,
  emptyDelegateForm,
  formToPayload,
  validateDelegateForm,
  type Delegate,
  type DelegateFormState,
} from '@/lib/delegateTypes';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeferredEffect } from '@/lib/useDeferredEffect';

export default function EditDelegatePage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [form, setForm] = useState<DelegateFormState>(emptyDelegateForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useDeferredEffect(() => {
    api.delegates.getById(id)
      .then((d) => setForm(delegateToForm(d as Delegate)))
      .catch(() => {
        toast.error('Delegate not found');
        router.replace('/admin/delegates');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

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
      await api.delegates.update(id, formToPayload(form));
      toast.success('Delegate updated');
      router.push(`/admin/delegates/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-npp-blue" size={28} /></div>;
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href={`/admin/delegates/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-npp-blue">
        <ArrowLeft size={16} /> Back to profile
      </Link>
      <h1 className="text-xl font-bold text-gray-900">Edit Delegate</h1>
      <p className="text-xs text-gray-500">Profile edits do not change survey history. Use the survey workflow to update support status.</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <DelegateFormFields form={form} errors={errors} onChange={setForm} />
        <div className="flex justify-end gap-2">
          <Link href={`/admin/delegates/${id}`} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-npp-blue text-white text-sm font-medium disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

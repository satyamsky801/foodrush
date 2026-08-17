import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { request } from '../../api/apiClient';
import { AdminTable } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { categoryEmoji } from '../../utils/images';

const EMPTY = { name: '', slug: '', emoji: '🍽️', tagline: '' };

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await request('/categories', { auth: false });
      setCategories(res.categories);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, emoji: c.emoji || '🍽️', tagline: c.tagline || '' });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast('Name and slug are required.', 'error');
      return;
    }
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      emoji: form.emoji.trim() || '🍽️',
      tagline: form.tagline.trim(),
    };
    try {
      if (editing) {
        await adminApi.updateCategory(editing._id, payload);
        toast('Category updated');
      } else {
        await adminApi.createCategory(payload);
        toast('Category created');
      }
      setModal(false);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await adminApi.deleteCategory(c._id);
      toast('Category deleted');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load categories</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Categories</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{categories ? `${categories.length} categories` : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-4 py-2.5 text-sm"><Plus size={15} /> Add category</button>
      </div>

      {!categories ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <AdminTable
          head={['Category', 'Slug', 'Tagline', 'Actions']}
          empty={categories.length === 0 ? 'No categories yet.' : ''}
          colSpan={4}
        >
          {categories.map((c) => (
            <tr key={c._id} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl dark:bg-brand-500/10">
                    {c.emoji || categoryEmoji(c.slug)}
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">{c.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">/{c.slug}</td>
              <td className="max-w-[280px] truncate px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">{c.tagline || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(c)} aria-label={`Delete ${c.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit category' : 'Add category'} icon="🏷️">
        <div className="space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <label className="label">Emoji</label>
              <input className="input text-center text-xl" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            </div>
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input" placeholder="biryani" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </div>
          <button onClick={save} disabled={busy} className="btn-primary w-full py-3">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create category'}</button>
        </div>
      </Modal>
    </div>
  );
}

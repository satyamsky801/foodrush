import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { request } from '../../api/apiClient';
import { AdminTable } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

const EMPTY = {
  code: '',
  type: 'percent',
  value: 20,
  maxDiscount: 100,
  minOrder: 0,
  title: '',
  description: '',
  isActive: true,
};

export default function AdminCouponsPage() {
  const toast = useToast();
  const [coupons, setCoupons] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await request('/coupons', { auth: false });
      setCoupons(res.coupons);
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
    setForm({ ...EMPTY, ...c, value: c.value ?? 0, maxDiscount: c.maxDiscount ?? 0, minOrder: c.minOrder ?? 0 });
    setModal(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast('Coupon code is required.', 'error');
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      minOrder: Number(form.minOrder) || 0,
    };
    try {
      if (editing) {
        await adminApi.updateCoupon(editing._id, payload);
        toast('Coupon updated');
      } else {
        await adminApi.createCoupon(payload);
        toast('Coupon created');
      }
      setModal(false);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await adminApi.updateCoupon(c._id, { isActive: !c.isActive });
      toast(c.isActive ? 'Coupon deactivated' : 'Coupon activated');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await adminApi.deleteCoupon(c._id);
      toast('Coupon deleted');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load coupons</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Coupons</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{coupons ? `${coupons.length} coupons` : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-4 py-2.5 text-sm"><Plus size={15} /> Add coupon</button>
      </div>

      {!coupons ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <AdminTable
          head={['Code', 'Discount', 'Min order', 'Max discount', 'Status', 'Actions']}
          empty={coupons.length === 0 ? 'No coupons yet.' : ''}
          colSpan={6}
        >
          {coupons.map((c) => (
            <tr key={c._id} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <span className="rounded-lg border border-dashed border-brand-400 bg-brand-50 px-2.5 py-1 font-mono text-xs font-extrabold tracking-wider text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {c.code}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">
                {c.type === 'freedelivery' ? 'Free delivery' : `${c.value}% off`}
                {c.title ? <span className="ml-1.5 text-xs text-zinc-400">· {c.title}</span> : null}
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">₹{c.minOrder || 0}</td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">₹{c.maxDiscount || '—'}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleActive(c)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    c.isActive
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Disabled'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} aria-label={`Edit ${c.code}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(c)} aria-label={`Delete ${c.code}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit coupon' : 'Add coupon'} icon="🎟️">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Code *</label>
              <input className="input font-mono uppercase" placeholder="SAVE20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="percent">Percentage off</option>
                <option value="freedelivery">Free delivery</option>
              </select>
            </div>
          </div>
          {form.type === 'percent' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">% off</label>
                <input className="input" type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <label className="label">Max discount (₹)</label>
                <input className="input" type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
              </div>
              <div>
                <label className="label">Min order (₹)</label>
                <input className="input" type="number" min={0} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
              </div>
            </div>
          )}
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="Flat 20% off" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-brand-500" />
            Active
          </label>
          <button onClick={save} disabled={busy} className="btn-primary w-full py-3">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}</button>
        </div>
      </Modal>
    </div>
  );
}

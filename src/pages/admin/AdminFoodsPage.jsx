import { useCallback, useEffect, useState } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminTable, inr } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import AppImage from '../../components/AppImage';
import { foodImage } from '../../utils/images';
import { useToast } from '../../context/ToastContext';

export default function AdminFoodsPage() {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState(null);
  const [restaurantFilter, setRestaurantFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadRestaurants = useCallback(async () => {
    try {
      const res = await adminApi.allRestaurants();
      setRestaurants(res.restaurants);
    } catch {
      // Non-fatal — the filter just stays empty.
    }
  }, []);

  const load = useCallback(async (restaurantId, query) => {
    try {
      const params = {};
      if (restaurantId) params.restaurant = restaurantId;
      if (query) params.search = query;
      const res = await adminApi.allFoods(params);
      setFoods(res.foods);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
    load('', '');
  }, [load, loadRestaurants]);

  useEffect(() => {
    const t = setTimeout(() => load(restaurantFilter, search.trim() || ''), 300);
    return () => clearTimeout(t);
  }, [restaurantFilter, search, load]);

  const toggleAvailable = async (f) => {
    try {
      await adminApi.updateFood(f._id, { isAvailable: !f.isAvailable });
      toast(f.isAvailable ? 'Item hidden from menu' : 'Item is now available');
      await load(restaurantFilter, search.trim() || '');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      name: f.name,
      price: f.price,
      veg: f.veg,
      isAvailable: f.isAvailable,
      isBestseller: f.isBestseller,
      isRecommended: f.isRecommended,
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || Number(form.price) < 0) {
      toast('Name and a valid price are required.', 'error');
      return;
    }
    setBusy(true);
    try {
      await adminApi.updateFood(editing._id, {
        name: form.name.trim(),
        price: Number(form.price),
        veg: form.veg,
        isAvailable: form.isAvailable,
        isBestseller: form.isBestseller,
        isRecommended: form.isRecommended,
      });
      toast('Food item updated');
      setModal(false);
      await load(restaurantFilter, search.trim() || '');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    try {
      await adminApi.deleteFood(f._id);
      toast('Food item deleted');
      await load(restaurantFilter, search.trim() || '');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load food items</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Food items</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{foods ? `${foods.length} items` : ''}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="input w-56 pl-10" placeholder="Search dishes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          className="input w-64"
          aria-label="Filter by restaurant"
        >
          <option value="">All restaurants</option>
          {restaurants.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
      </div>

      {!foods ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <AdminTable
          head={['Item', 'Restaurant', 'Price', 'Type', 'Section', 'Availability', 'Actions']}
          empty={foods.length === 0 ? 'No food items found.' : ''}
          colSpan={7}
        >
          {foods.map((f) => (
            <tr key={f._id} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <AppImage src={f.image || foodImage(f.category)} alt={f.name} emoji="🍽️" className="h-11 w-11 shrink-0 rounded-xl" />
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-100">{f.name}</p>
                    <p className="max-w-[220px] truncate text-xs text-zinc-400">{f.description}</p>
                  </div>
                </div>
              </td>
              <td className="max-w-[150px] truncate px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{f.restaurant?.name || '—'}</td>
              <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-50">{inr(f.price)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  f.veg ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-ember-50 text-ember-500 dark:bg-ember-500/10 dark:text-ember-400'
                }`}>
                  <span className={`h-2 w-2 rounded-full border ${f.veg ? 'border-emerald-600' : 'border-ember-500'}`} />
                  {f.veg ? 'Veg' : 'Non-veg'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{f.section || '—'}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleAvailable(f)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    f.isAvailable
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {f.isAvailable ? 'Available' : 'Hidden'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(f)} aria-label={`Edit ${f.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(f)} aria-label={`Delete ${f.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Edit food item" icon="🍽️" maxWidth="max-w-lg">
        {form && (
          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input className="input" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'veg', label: 'Veg 🌱' },
                { key: 'isAvailable', label: 'Available ✅' },
                { key: 'isBestseller', label: 'Bestseller ⭐' },
                { key: 'isRecommended', label: 'Recommended 🔥' },
              ].map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="h-4 w-4 accent-brand-500" />
                  {label}
                </label>
              ))}
            </div>
            <button onClick={save} disabled={busy} className="btn-primary w-full py-3">{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

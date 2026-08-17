import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminTable, inr } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import AppImage from '../../components/AppImage';
import { coverImage } from '../../utils/images';
import { useToast } from '../../context/ToastContext';

const EMPTY = {
  name: '',
  slug: '',
  image: '',
  cuisine: '',
  categories: '',
  area: '',
  address: '',
  deliveryTime: '25–35 min',
  deliveryMin: 30,
  deliveryFee: 0,
  freeDeliveryAbove: '',
  priceForTwo: 300,
  offers: '',
  pureVeg: false,
  featured: false,
  topRated: false,
  isActive: true,
};

export default function AdminRestaurantsPage() {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.allRestaurants();
      setRestaurants(res.restaurants);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (r) => {
    try {
      await adminApi.updateRestaurant(r._id, { isActive: !r.isActive });
      toast(r.isActive ? 'Restaurant disabled' : 'Restaurant enabled');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, image: coverImage(Math.floor(Math.random() * 10)) });
    setModal(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      ...EMPTY,
      ...r,
      cuisine: (r.cuisine || []).join(', '),
      categories: (r.categories || []).join(','),
      offers: (r.offers || []).join(' | '),
      freeDeliveryAbove: r.freeDeliveryAbove ?? '',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast('Name and slug are required.', 'error');
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      cuisine: form.cuisine.split(',').map((s) => s.trim()).filter(Boolean),
      categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
      offers: form.offers.split('|').map((s) => s.trim()).filter(Boolean),
      freeDeliveryAbove: form.freeDeliveryAbove === '' ? null : Number(form.freeDeliveryAbove),
      deliveryFee: Number(form.deliveryFee) || 0,
      deliveryMin: Number(form.deliveryMin) || 30,
      priceForTwo: Number(form.priceForTwo) || 0,
    };
    try {
      if (editing) {
        await adminApi.updateRestaurant(editing._id, payload);
        toast('Restaurant updated');
      } else {
        await adminApi.createRestaurant(payload);
        toast('Restaurant created');
      }
      setModal(false);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.name}? Its menu items will also be removed.`)) return;
    try {
      await adminApi.deleteRestaurant(r._id);
      toast('Restaurant deleted');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const filtered = (restaurants || []).filter((r) =>
    !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()) || r.area.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load restaurants</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Restaurants</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{restaurants ? `${restaurants.length} total` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input className="input w-56 pl-10" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={openAdd} className="btn-primary px-4 py-2.5 text-sm"><Plus size={15} /> Add</button>
        </div>
      </div>

      {!restaurants ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <AdminTable
          head={['Restaurant', 'Cuisine', 'Area', 'Rating', 'Price for two', 'Status', 'Actions']}
          empty={filtered.length === 0 ? 'No restaurants found.' : ''}
          colSpan={7}
        >
          {filtered.map((r) => (
            <tr key={r._id} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <AppImage src={r.image} alt={r.name} emoji="🍽️" className="h-11 w-11 shrink-0 rounded-xl" />
                  <div>
                    <Link to={`/restaurant/${r.slug}`} className="font-semibold text-zinc-800 hover:text-brand-600 dark:text-zinc-100 dark:hover:text-brand-400">
                      {r.name}
                    </Link>
                    <p className="text-xs text-zinc-400">/{r.slug}</p>
                  </div>
                </div>
              </td>
              <td className="max-w-[180px] px-4 py-3">
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{(r.cuisine || []).join(', ') || '—'}</p>
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{r.area || '—'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  <Star size={13} className="fill-amber-400 text-amber-400" /> {r.rating || '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{inr(r.priceForTwo)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleActive(r)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    r.isActive
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {r.isActive ? 'Active' : 'Disabled'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(r)} aria-label={`Delete ${r.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Add / edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit restaurant' : 'Add restaurant'} icon="🏪" maxWidth="max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name *"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug *"><input className="input" placeholder="spice-garden" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Image URL"><input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></Field>
          <Field label="Area"><input className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field>
          <Field label="Cuisine (comma-separated)"><input className="input" placeholder="North Indian, Mughlai" value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} /></Field>
          <Field label="Categories (comma-separated)"><input className="input" placeholder="biryani, north-indian" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} /></Field>
          <Field label="Delivery time"><input className="input" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} /></Field>
          <Field label="Delivery min (mins)"><input className="input" type="number" value={form.deliveryMin} onChange={(e) => setForm({ ...form, deliveryMin: e.target.value })} /></Field>
          <Field label="Delivery fee (₹)"><input className="input" type="number" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} /></Field>
          <Field label="Free delivery above (₹, blank = none)"><input className="input" type="number" value={form.freeDeliveryAbove} onChange={(e) => setForm({ ...form, freeDeliveryAbove: e.target.value })} /></Field>
          <Field label="Price for two (₹)"><input className="input" type="number" value={form.priceForTwo} onChange={(e) => setForm({ ...form, priceForTwo: e.target.value })} /></Field>
          <Field label="Address"><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Offers (separate with |)"><input className="input" placeholder="50% off | Free delivery" value={form.offers} onChange={(e) => setForm({ ...form, offers: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { key: 'pureVeg', label: 'Pure veg 🌱' },
            { key: 'featured', label: 'Featured ⭐' },
            { key: 'topRated', label: 'Top rated 🔥' },
            { key: 'isActive', label: 'Active ✅' },
          ].map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="h-4 w-4 accent-brand-500"
              />
              {label}
            </label>
          ))}
        </div>
        <button onClick={save} disabled={busy} className="btn-primary mt-5 w-full py-3">
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Create restaurant'}
        </button>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

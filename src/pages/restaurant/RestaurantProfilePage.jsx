import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { restaurantApi } from '../../api/restaurantApi';
import { Skeleton } from '../../components/LoadingSkeleton';
import AppImage from '../../components/AppImage';
import { useToast } from '../../context/ToastContext';

export default function RestaurantProfilePage() {
  const toast = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await restaurantApi.me();
      setRestaurant(res.restaurant);
      setForm({
        name: res.restaurant.name,
        image: res.restaurant.image,
        cuisine: (res.restaurant.cuisine || []).join(', '),
        deliveryTime: res.restaurant.deliveryTime,
        deliveryMin: res.restaurant.deliveryMin,
        deliveryFee: res.restaurant.deliveryFee,
        freeDeliveryAbove: res.restaurant.freeDeliveryAbove ?? '',
        priceForTwo: res.restaurant.priceForTwo,
        pureVeg: res.restaurant.pureVeg,
        area: res.restaurant.area,
        address: res.restaurant.address,
        offers: (res.restaurant.offers || []).join(' | '),
        isActive: res.restaurant.isActive,
      });
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) {
      toast('Restaurant name is required.', 'error');
      return;
    }
    setBusy(true);
    try {
      await restaurantApi.updateProfile({
        ...form,
        name: form.name.trim(),
        cuisine: form.cuisine.split(',').map((s) => s.trim()).filter(Boolean),
        offers: form.offers.split('|').map((s) => s.trim()).filter(Boolean),
        freeDeliveryAbove: form.freeDeliveryAbove === '' ? null : Number(form.freeDeliveryAbove),
        deliveryFee: Number(form.deliveryFee) || 0,
        deliveryMin: Number(form.deliveryMin) || 30,
        priceForTwo: Number(form.priceForTwo) || 0,
      });
      toast('Restaurant profile updated');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load your profile</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!restaurant || !form) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Restaurant profile</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">These details appear to customers on your restaurant page.</p>
      </div>

      {/* Preview */}
      <div className="card overflow-hidden">
        <AppImage src={form.image} alt={form.name} emoji="🏪" className="h-40 w-full" />
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{form.name || 'Your restaurant'}</p>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {restaurant.rating ? `${restaurant.rating} ★ (${restaurant.ratingCount})` : 'No ratings yet'} · {restaurant.slug}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${form.isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
              {form.isActive ? 'Open for orders' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Restaurant name *"><input className="input" value={form.name} onChange={set('name')} /></Field>
          <Field label="Image URL"><input className="input" value={form.image} onChange={set('image')} /></Field>
          <Field label="Cuisine (comma-separated)"><input className="input" placeholder="North Indian, Mughlai" value={form.cuisine} onChange={set('cuisine')} /></Field>
          <Field label="Area"><input className="input" value={form.area} onChange={set('area')} /></Field>
          <Field label="Delivery time"><input className="input" value={form.deliveryTime} onChange={set('deliveryTime')} /></Field>
          <Field label="Delivery min (mins)"><input className="input" type="number" min="0" value={form.deliveryMin} onChange={set('deliveryMin')} /></Field>
          <Field label="Delivery fee (₹)"><input className="input" type="number" min="0" value={form.deliveryFee} onChange={set('deliveryFee')} /></Field>
          <Field label="Free delivery above (₹, blank = none)"><input className="input" type="number" min="0" value={form.freeDeliveryAbove} onChange={set('freeDeliveryAbove')} /></Field>
          <Field label="Price for two (₹)"><input className="input" type="number" min="0" value={form.priceForTwo} onChange={set('priceForTwo')} /></Field>
        </div>

        <Field label="Address">
          <textarea className="input min-h-[70px] resize-y" value={form.address} onChange={set('address')} />
        </Field>

        <Field label="Offers (separate with |)">
          <input className="input" placeholder="50% off up to ₹100 | Free delivery" value={form.offers} onChange={set('offers')} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={form.pureVeg} onChange={(e) => setForm((f) => ({ ...f, pureVeg: e.target.checked }))} className="h-4 w-4 accent-brand-500" />
            Pure veg 🌱
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-brand-500" />
            Accepting orders (open) ✅
          </label>
        </div>

        <button onClick={save} disabled={busy} className="btn-primary px-6 py-2.5 text-sm">
          <Save size={15} /> {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
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

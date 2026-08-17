import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { restaurantApi } from '../../api/restaurantApi';
import { Skeleton } from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import AppImage from '../../components/AppImage';
import { foodImage } from '../../utils/images';
import { useToast } from '../../context/ToastContext';
import { inr } from '../admin/adminUi';

let uidCounter = 0;
const uid = () => `opt-${Date.now().toString(36)}-${(uidCounter += 1)}`;

const EMPTY = {
  name: '',
  description: '',
  price: '',
  category: 'generic',
  section: '',
  image: '',
  veg: true,
  isAvailable: true,
  isBestseller: false,
  isRecommended: false,
  addons: [],
  customizations: [],
};

const CATEGORY_OPTIONS = [
  'generic', 'pizza', 'burger', 'biryani', 'chinese', 'south-indian',
  'north-indian', 'rolls', 'desserts', 'cakes', 'fast-food', 'healthy', 'beverages',
];

export default function RestaurantFoodsPage() {
  const toast = useToast();
  const [foods, setFoods] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meRes, foodsRes] = await Promise.all([restaurantApi.me(), restaurantApi.foods({ available: '' })]);
      setRestaurant(meRes.restaurant);
      setFoods(foodsRes.foods);
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
    setForm({ ...EMPTY, image: foodImage(Math.floor(Math.random() * 10)) });
    setModal(true);
  };

  const openEdit = (food) => {
    setEditing(food);
    setForm({
      ...EMPTY,
      ...food,
      price: food.price,
      addons: (food.addons || []).map((a) => ({ ...a })),
      customizations: (food.customizations || []).map((g) => ({ ...g, options: (g.options || []).map((o) => ({ ...o })) })),
    });
    setModal(true);
  };

  const save = async () => {
    // Validation
    if (!form.name.trim()) {
      toast('Food name is required.', 'error');
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast('Please enter a valid price greater than zero.', 'error');
      return;
    }
    for (const a of form.addons) {
      if (Number(a.price) < 0) {
        toast(`Add-on "${a.name}" cannot have a negative price.`, 'error');
        return;
      }
    }
    for (const g of form.customizations) {
      for (const o of g.options) {
        if (Number(o.price) < 0) {
          toast(`Option "${o.name}" cannot have a negative price.`, 'error');
          return;
        }
      }
    }

    setBusy(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      section: form.section.trim() || 'Recommended',
      price,
      addons: form.addons.map((a) => ({ id: a.id || uid(), name: a.name.trim(), price: Number(a.price) || 0 })),
      customizations: form.customizations.map((g) => ({
        id: g.id || uid(),
        name: g.name.trim(),
        required: Boolean(g.required),
        options: g.options.map((o) => ({ id: o.id || uid(), name: o.name.trim(), price: Number(o.price) || 0 })),
      })),
    };
    try {
      if (editing) {
        await restaurantApi.updateFood(editing._id, payload);
        toast('Dish updated');
      } else {
        await restaurantApi.createFood(payload);
        toast('Dish added to your menu');
      }
      setModal(false);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (food) => {
    if (!window.confirm(`Delete "${food.name}" from your menu?`)) return;
    try {
      await restaurantApi.deleteFood(food._id);
      toast('Dish deleted');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const toggleAvailability = async (food) => {
    try {
      await restaurantApi.updateFood(food._id, { isAvailable: !food.isAvailable });
      toast(food.isAvailable ? 'Marked unavailable' : 'Marked available');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const filtered = (foods || []).filter((f) =>
    !search.trim() || f.name.toLowerCase().includes(search.toLowerCase()) || (f.section || '').toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load your menu</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Menu</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{foods ? `${foods.length} dishes` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input className="input w-52 pl-10" placeholder="Search menu…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={openAdd} className="btn-primary px-4 py-2.5 text-sm"><Plus size={15} /> Add dish</button>
        </div>
      </div>

      {!foods ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl">🍲</p>
          <p className="mt-3 font-semibold text-zinc-800 dark:text-zinc-100">No dishes found</p>
          <p className="mt-1 text-sm text-zinc-400">Add your first dish to start taking orders.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((food) => (
            <div key={food._id} className="card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative">
                <AppImage src={food.image} alt={food.name} emoji="🍽️" className="aspect-[4/3]" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-sm bg-white shadow ${food.veg ? 'text-emerald-600' : 'text-ember-500'}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${food.veg ? 'bg-emerald-500' : 'bg-ember-500'}`} />
                  </span>
                  {food.isBestseller && (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">Bestseller</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{food.name}</p>
                    <p className="truncate text-xs text-zinc-400">{food.section || 'Recommended'}</p>
                  </div>
                  <span className="shrink-0 font-display font-extrabold text-zinc-900 dark:text-zinc-50">{inr(food.price)}</span>
                </div>
                {food.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{food.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <button
                    onClick={() => toggleAvailability(food)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      food.isAvailable
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {food.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(food)} aria-label={`Edit ${food.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(food)} aria-label={`Delete ${food.name}`} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit dish modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit dish' : 'Add dish'} icon="🍲" maxWidth="max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name *"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Price (₹) *"><input className="input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Description">
            <textarea className="input min-h-[70px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Menu section"><input className="input" placeholder="Starters, Main Course…" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="Image URL"><input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { key: 'veg', label: 'Veg 🌱', on: form.veg },
            { key: 'isAvailable', label: 'Available ✅', on: form.isAvailable },
            { key: 'isBestseller', label: 'Bestseller ⭐', on: form.isBestseller },
            { key: 'isRecommended', label: 'Recommended 🔥', on: form.isRecommended },
          ].map(({ key, label, on }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={Boolean(on)}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="h-4 w-4 accent-brand-500"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Add-ons */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Add-ons</h4>
            <button
              onClick={() => setForm({ ...form, addons: [...form.addons, { id: uid(), name: '', price: '' }] })}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              + Add add-on
            </button>
          </div>
          {form.addons.length === 0 ? (
            <p className="text-xs text-zinc-400">No add-ons — e.g. extra cheese ₹40.</p>
          ) : (
            <div className="space-y-2">
              {form.addons.map((addon, i) => (
                <div key={addon.id} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Add-on name"
                    value={addon.name}
                    onChange={(e) => setForm({ ...form, addons: form.addons.map((a, j) => (j === i ? { ...a, name: e.target.value } : a)) })}
                  />
                  <input
                    className="input w-24"
                    type="number"
                    min="0"
                    placeholder="₹"
                    value={addon.price}
                    onChange={(e) => setForm({ ...form, addons: form.addons.map((a, j) => (j === i ? { ...a, price: e.target.value } : a)) })}
                  />
                  <button
                    onClick={() => setForm({ ...form, addons: form.addons.filter((_, j) => j !== i) })}
                    aria-label="Remove add-on"
                    className="rounded-full p-2 text-zinc-400 hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customizations */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Customizations</h4>
            <button
              onClick={() => setForm({ ...form, customizations: [...form.customizations, { id: uid(), name: '', required: false, options: [] }] })}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              + Add option group
            </button>
          </div>
          {form.customizations.length === 0 ? (
            <p className="text-xs text-zinc-400">No customizations — e.g. spice level, portion size.</p>
          ) : (
            <div className="space-y-3">
              {form.customizations.map((group, gi) => (
                <div key={group.id} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Group name (e.g. Spice level)"
                      value={group.name}
                      onChange={(e) =>
                        setForm({ ...form, customizations: form.customizations.map((g, j) => (j === gi ? { ...g, name: e.target.value } : g)) })
                      }
                    />
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={Boolean(group.required)}
                        onChange={(e) =>
                          setForm({ ...form, customizations: form.customizations.map((g, j) => (j === gi ? { ...g, required: e.target.checked } : g)) })
                        }
                        className="h-3.5 w-3.5 accent-brand-500"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => setForm({ ...form, customizations: form.customizations.filter((_, j) => j !== gi) })}
                      aria-label="Remove option group"
                      className="rounded-full p-2 text-zinc-400 hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {group.options.map((opt, oi) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          className="input flex-1"
                          placeholder="Option name"
                          value={opt.name}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              customizations: form.customizations.map((g, j) =>
                                j === gi ? { ...g, options: g.options.map((o, k) => (k === oi ? { ...o, name: e.target.value } : o)) } : g
                              ),
                            })
                          }
                        />
                        <input
                          className="input w-24"
                          type="number"
                          min="0"
                          placeholder="₹"
                          value={opt.price}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              customizations: form.customizations.map((g, j) =>
                                j === gi ? { ...g, options: g.options.map((o, k) => (k === oi ? { ...o, price: e.target.value } : o)) } : g
                              ),
                            })
                          }
                        />
                        <button
                          onClick={() =>
                            setForm({
                              ...form,
                              customizations: form.customizations.map((g, j) =>
                                j === gi ? { ...g, options: g.options.filter((_, k) => k !== oi) } : g
                              ),
                            })
                          }
                          aria-label="Remove option"
                          className="rounded-full p-2 text-zinc-400 hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          customizations: form.customizations.map((g, j) =>
                            j === gi ? { ...g, options: [...g.options, { id: uid(), name: '', price: '' }] } : g
                          ),
                        })
                      }
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      + Add option
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={busy} className="btn-primary mt-5 w-full py-3">
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Add to menu'}
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

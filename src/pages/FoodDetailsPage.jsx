import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import AppImage from '../components/AppImage';
import Rating from '../components/Rating';
import VegIndicator from '../components/VegIndicator';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/LoadingSkeleton';
import { useFetch } from '../hooks/useFetch';
import { foodApi } from '../api/foodApi';
import { mapFood } from '../api/normalizers';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';
import { categoryEmoji } from '../utils/images';

export default function FoodDetailsPage() {
  const { restaurantId, foodId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // GET /api/foods/:id — the food arrives with its restaurant populated.
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const { food } = await foodApi.getById(foodId);
      return { food: mapFood(food, food.restaurant) };
    },
    [foodId]
  );

  const food = data?.food || null;

  // Default each required customization to its first option.
  const [customizations, setCustomizations] = useState(() => ({}));
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // Initialise customization selections once the food loads.
  const initialized = useMemo(() => {
    if (!food || Object.keys(customizations).length > 0) return false;
    setCustomizations(
      Object.fromEntries(
        (food.customizations || []).map((c) => [c.id, c.required ? c.options[0]?.id : null])
      )
    );
    return true;
  }, [food, customizations]);

  const priceBreakdown = useMemo(() => {
    const addonTotal = (food?.addons || [])
      .filter((a) => selectedAddons.includes(a.id))
      .reduce((s, a) => s + a.price, 0);
    const customTotal = (food?.customizations || []).reduce((s, c) => {
      const opt = c.options.find((o) => o.id === customizations[c.id]);
      return s + (opt?.price || 0);
    }, 0);
    return { addonTotal, customTotal, unitPrice: (food?.price || 0) + addonTotal + customTotal };
  }, [food, selectedAddons, customizations]);

  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[4/3] w-full rounded-3xl skeleton" />
          <div className="space-y-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="container-app py-20">
        {error ? (
          <EmptyState icon="📡" title="Couldn't load this dish" description={error.message} actionLabel="Try again" onAction={refetch} />
        ) : (
          <EmptyState icon="🍽️" title="Dish not found" description="This dish may have been removed from the menu." actionLabel="Back to restaurants" actionTo="/restaurants" />
        )}
      </div>
    );
  }

  const toggleAddon = (id) =>
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleAddToCart = () => {
    const addons = (food.addons || [])
      .filter((a) => selectedAddons.includes(a.id))
      .map((a) => ({ id: a.id, name: a.name, price: a.price }));
    const customSelections = (food.customizations || [])
      .map((c) => {
        const opt = c.options.find((o) => o.id === customizations[c.id]);
        return opt ? { id: c.id, name: c.name, optionId: opt.id, optionName: opt.name, price: opt.price } : null;
      })
      .filter(Boolean);

    addItem(food, { quantity, addons, customizations: customSelections });
    setQuantity(1);
  };

  return (
    <div className="container-app py-6 sm:py-10">
      <Link
        to={`/restaurant/${restaurantId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-300"
      >
        <ArrowLeft size={16} /> Back to {food.restaurantName || 'restaurant'}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <AppImage
            src={food.image}
            alt={food.name}
            emoji={categoryEmoji(food.category)}
            className="aspect-[4/3] w-full rounded-3xl shadow-card"
          />
        </div>

        {/* Details */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <VegIndicator veg={food.veg} size={14} />
            {food.isBestseller && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                Bestseller
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">{food.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={food.rating} count={food.ratingCount} />
            <span className="text-xs text-zinc-400 dark:text-zinc-500">from {food.restaurantName}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-base">{food.description}</p>

          {/* Price */}
          <div className="mt-5 rounded-2xl bg-brand-50 px-5 py-4 dark:bg-brand-500/10">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Total price</p>
            <p className="font-display text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatINR(priceBreakdown.unitPrice * quantity)}
            </p>
            {quantity > 1 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatINR(priceBreakdown.unitPrice)} × {quantity}
              </p>
            )}
          </div>

          {/* Customizations */}
          {(food.customizations || []).length > 0 && (
            <div className="mt-6 space-y-6">
              {food.customizations.map((c) => (
                <fieldset key={c.id}>
                  <legend className="mb-2.5 flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {c.name}
                    {c.required && <span className="text-xs font-semibold text-ember-500">* Required</span>}
                  </legend>
                  <div className="space-y-2">
                    {c.options.map((o) => {
                      const active = customizations[c.id] === o.id;
                      return (
                        <button
                          key={o.id}
                          onClick={() => setCustomizations((prev) => ({ ...prev, [c.id]: o.id }))}
                          aria-pressed={active}
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                            active
                              ? 'border-brand-500 bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                              : 'border-zinc-200 text-zinc-700 hover:border-brand-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand-500/50'
                          }`}
                        >
                          <span>{o.name}</span>
                          <span className={active ? 'font-bold text-brand-600' : 'font-medium text-zinc-400 dark:text-zinc-500'}>
                            {o.price > 0 ? `+ ${formatINR(o.price)}` : o.price < 0 ? `− ${formatINR(-o.price)}` : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {/* Add-ons */}
          {(food.addons || []).length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">Add-ons</h3>
              <div className="space-y-2">
                {food.addons.map((a) => {
                  const active = selectedAddons.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAddon(a.id)}
                      aria-pressed={active}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'border-zinc-200 text-zinc-700 hover:border-brand-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand-500/50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 text-[10px] font-bold transition-colors ${
                            active ? 'border-brand-500 bg-brand-500 text-white' : 'border-zinc-300 text-transparent dark:border-zinc-600'
                          }`}
                        >
                          ✓
                        </span>
                        {a.name}
                      </span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">+ {formatINR(a.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(!food.customizations?.length && !food.addons?.length) && (
            <p className="mt-6 flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
              <UtensilsCrossed size={16} /> No customisation available for this dish.
            </p>
          )}

          {/* Quantity + Add */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit items-center overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-11 w-11 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-90 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-display text-lg font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex h-11 w-11 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-90 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="btn-primary flex-1 py-3.5 text-base"
            >
              <ShoppingCart size={18} />
              Add {quantity > 1 ? `${quantity} items` : 'to cart'} · {formatINR(priceBreakdown.unitPrice * quantity)}
            </button>
          </div>

          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            Prices are confirmed by the kitchen at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgePercent, Bike, Clock, Heart, MapPin, Wallet } from 'lucide-react';
import AppImage from '../components/AppImage';
import Rating from '../components/Rating';
import VegIndicator from '../components/VegIndicator';
import Stepper from '../components/Stepper';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/LoadingSkeleton';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { getRestaurant } from '../data/restaurants';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { formatINR } from '../utils/format';
import { categoryEmoji } from '../utils/images';

export default function RestaurantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurant = getRestaurant(id);
  const { cart, addItem, updateQuantity } = useCart();
  const { isRestaurantFav, toggleRestaurant } = useFavorites();
  const loading = useFakeLoading([id], 600);

  const menuWithIds = useMemo(
    () =>
      (restaurant?.menu || []).map((section, i) => ({
        ...section,
        anchor: `${section.category.toLowerCase().replace(/\s+/g, '-')}-${i}`,
      })),
    [restaurant]
  );

  if (!restaurant) {
    return (
      <div className="container-app py-20">
        <EmptyState
          icon="🔍"
          title="Restaurant not found"
          description="This restaurant may have been removed or the link is incorrect."
          actionLabel="Browse restaurants"
          actionTo="/restaurants"
        />
      </div>
    );
  }

  const fav = isRestaurantFav(restaurant.id);

  return (
    <div>
      {/* Banner */}
      <div className="relative h-52 sm:h-72">
        <AppImage
          src={restaurant.image}
          alt={restaurant.name}
          emoji="🍽️"
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <Link
          to="/restaurants"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-zinc-800 shadow-md backdrop-blur-sm transition-transform hover:scale-105 dark:bg-zinc-900/90 dark:text-zinc-100"
        >
          ← Back
        </Link>
      </div>

      {/* Info card */}
      <div className="container-app">
        <div className="card -mt-12 relative z-10 p-5 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                    {restaurant.name}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">{restaurant.cuisine.join(', ')}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={14} className="text-brand-600" />{restaurant.deliveryTime}</span>
                    <span className="inline-flex items-center gap-1"><Wallet size={14} className="text-brand-600" />{formatINR(restaurant.priceForTwo)} for two</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Rating value={restaurant.rating} count={restaurant.ratingCount} />
                  <button
                    onClick={() => toggleRestaurant(restaurant.id, restaurant.name)}
                    aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-all hover:border-ember-400 hover:text-ember-500 active:scale-90 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    <Heart size={18} className={fav ? 'fill-ember-500 text-ember-500' : ''} />
                  </button>
                </div>
              </div>

              <p className="flex items-start gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" />
                {restaurant.address}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <VegIndicator veg={restaurant.pureVeg} size={12} />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {restaurant.pureVeg ? 'Pure vegetarian' : 'Veg & non-veg'}
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Bike size={14} /> {restaurant.deliveryFee === 0 ? 'Free delivery' : `Delivery ${formatINR(restaurant.deliveryFee)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Offers */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {restaurant.offers.map((offer) => (
            <div key={offer} className="flex items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 px-4 py-3 dark:border-brand-500/40 dark:bg-brand-500/10">
              <BadgePercent size={20} className="shrink-0 text-brand-600" />
              <p className="text-sm font-bold text-brand-700 dark:text-brand-400">{offer}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="mt-8">
          <h2 className="mb-5 font-display text-xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-2xl">Full menu</h2>

          {/* Sticky category links */}
          <div className="sticky top-16 z-30 -mx-4 mb-2 border-b border-zinc-100 bg-zinc-50/95 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 sm:mx-0 sm:px-0">
            <div className="no-scrollbar flex gap-5 overflow-x-auto py-3">
              {menuWithIds.map((section) => (
                <a
                  key={section.anchor}
                  href={`#${section.anchor}`}
                  className="shrink-0 text-sm font-semibold text-zinc-500 transition-colors hover:text-brand-600 dark:text-zinc-400"
                >
                  {section.category}
                </a>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-6 py-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ))}
            </div>
          ) : (
            menuWithIds.map((section) => (
              <section key={section.anchor} id={section.anchor} className="scroll-mt-40 py-5">
                <h3 className="mb-3 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">{section.category}</h3>
                <div>
                  {section.items.map((item) => (
                    <MenuItemRow
                      key={item.id}
                      item={item}
                      inCartLine={cart.items?.find((it) => it.id === item.id && !it.addons?.length && !it.customizations?.length)}
                      onAdd={() => addItem(item, { quantity: 1 })}
                      onQtyChange={(q) => {
                        const line = cart.items?.find((it) => it.id === item.id && !it.addons?.length && !it.customizations?.length);
                        if (line) updateQuantity(line.key, q);
                      }}
                      onCustomise={() => navigate(`/food/${restaurant.id}/${item.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItemRow({ item, inCartLine, onAdd, onQtyChange, onCustomise }) {
  const needsCustomisation = item.customizations?.some((c) => c.required);

  return (
    <div className="flex justify-between gap-4 border-b border-zinc-100 py-5 last:border-0 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <VegIndicator veg={item.veg} size={12} />
          {item.isBestseller && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              Bestseller
            </span>
          )}
        </div>
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</h4>
        <p className="mt-0.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{formatINR(item.price)}</p>
        <p className="mt-1 line-clamp-2 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
        <div className="mt-1.5">
          <Rating value={item.rating} size="xs" />
        </div>
      </div>

      <div className="relative w-28 shrink-0 sm:w-36">
        <button
          onClick={() => (needsCustomisation ? onCustomise() : onAdd())}
          className="block w-full"
          aria-label={`View ${item.name}`}
        >
          <AppImage
            src={item.image}
            alt={item.name}
            emoji={categoryEmoji(item.category)}
            className="aspect-square w-full rounded-2xl"
          />
        </button>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          {inCartLine ? (
            <div className="rounded-full bg-white shadow-md dark:bg-zinc-900">
              <Stepper quantity={inCartLine.quantity} onChange={onQtyChange} size="sm" />
            </div>
          ) : (
            <button
              onClick={() => (needsCustomisation ? onCustomise() : onAdd())}
              className="rounded-full border border-brand-500 bg-white px-5 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-600 shadow-md transition-all hover:bg-brand-500 hover:text-white active:scale-95 dark:bg-zinc-900"
            >
              {needsCustomisation ? 'Customise' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

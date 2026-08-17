import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, SearchX, SlidersHorizontal, X } from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import FoodCard from '../components/FoodCard';
import FilterPanel, { DEFAULT_FILTERS } from '../components/FilterPanel';
import SortDropdown from '../components/SortDropdown';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { SkeletonFoodCard, SkeletonRestaurantCard } from '../components/LoadingSkeleton';
import { useFetch } from '../hooks/useFetch';
import { categories, getCategory } from '../data/categories';
import { restaurantApi } from '../api/restaurantApi';
import { foodApi } from '../api/foodApi';
import { mapRestaurant, mapFood } from '../api/normalizers';
import { useSettings } from '../context/SettingsContext';

/** Map the UI sort options to the backend's SORT_MAP keys. */
const sortForServer = (sort) => {
  switch (sort) {
    case 'rating':
      return 'rating';
    case 'delivery':
      return 'delivery-time';
    case 'price-low':
      return 'price';
    default:
      return 'relevance';
  }
};

export default function RestaurantListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'relevance';

  const [input, setInput] = useState(q);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { settings } = useSettings();

  // Keep the search box in sync when the URL changes (navbar search, back button).
  useEffect(() => setInput(q), [q]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: false });
  };

  // Server-driven filtering: the backend applies search/category/sort/rating/
  // delivery-time/price/veg — the same rules the UI used to apply in-memory.
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const pureVeg = settings.vegMode || filters.pureVeg ? true : undefined;
      const params = {
        search: q || undefined,
        category: categoryParam || undefined,
        sort: sortParam === 'price-high' ? undefined : sortForServer(sortParam),
        rating: filters.rating || undefined,
        maxTime: filters.maxDelivery || undefined,
        maxPrice:
          filters.priceRange === 'low'
            ? 300
            : filters.priceRange === 'mid'
              ? 600
              : undefined,
        pureVeg,
      };

      const [restaurantRes, foodRes] = await Promise.all([
        restaurantApi.list(params),
        q.trim()
          ? foodApi.list({ search: q.trim() })
          : Promise.resolve({ foods: [] }),
      ]);

      let list = (restaurantRes.restaurants || []).map(mapRestaurant);

      // Client-side for the gaps the API doesn't cover: multi-cuisine,
      // the lower bound of the mid/high price ranges, and price-high sort.
      if (filters.cuisines.length) {
        list = list.filter((r) => r.cuisine.some((c) => filters.cuisines.includes(c)));
      }
      if (filters.priceRange === 'mid') list = list.filter((r) => r.priceForTwo > 300);
      if (filters.priceRange === 'high') list = list.filter((r) => r.priceForTwo > 600);
      if (sortParam === 'price-high') {
        list = [...list].sort((a, b) => b.priceForTwo - a.priceForTwo);
      }

      const dishMatches = (foodRes.foods || [])
        .filter((f) => (settings.vegMode ? f.veg : true))
        .slice(0, 10)
        .map((f) => mapFood(f, f.restaurant));

      return { list, dishMatches };
    },
    [q, categoryParam, sortParam, filters, settings.vegMode]
  );

  const filtered = data?.list || [];
  const dishMatches = data?.dishMatches || [];

  const hasActiveFilters =
    Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))) ||
    Boolean(categoryParam);

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({}, { replace: false });
  };

  return (
    <div className="container-app py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {q
            ? `Results for “${q}”`
            : getCategory(categoryParam)
              ? `${getCategory(categoryParam).emoji} ${getCategory(categoryParam).name} restaurants`
              : 'All restaurants'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {loading ? 'Loading…' : `${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''} near you`}
          {settings.vegMode && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Veg mode on</span>}
        </p>
      </div>

      {/* Search + controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={input} onChange={setInput} onSubmit={(v) => setParam('q', v.trim() || null)} className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-chip transition-all hover:border-brand-400 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-brand-500 sm:flex-none"
          >
            <SlidersHorizontal size={15} className="text-brand-600" />
            Filters
            {hasActiveFilters && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{'•'}</span>}
          </button>
          <SortDropdown value={sortParam} onChange={(v) => setParam('sort', v)} />
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const active = categoryParam === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setParam('category', active ? null : c.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                active
                  ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {c.emoji} {c.name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-zinc-100 bg-white p-5 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClear={() => {
                setFilters(DEFAULT_FILTERS);
                if (categoryParam) setSearchParams({ sort: sortParam }, { replace: false });
              }}
            />
          </div>
        </aside>

        {/* Results */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <SkeletonRestaurantCard key={i} />)}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-ember-300 bg-ember-50/50 p-10 text-center dark:border-ember-500/40 dark:bg-ember-500/10">
              <p className="text-3xl">📡</p>
              <p className="mt-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Couldn't load restaurants</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                {error.message}
              </p>
              <button onClick={refetch} className="btn-secondary mt-4 px-5 py-2.5 text-sm">
                <RefreshCw size={15} /> Try again
              </button>
            </div>
          ) : (
            <>
              {/* Dish matches */}
              {dishMatches.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Dishes matching “{q}”
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {dishMatches.map((f) => (
                      <FoodCard key={f.id} food={f} showRestaurant />
                    ))}
                  </div>
                </div>
              )}

              {filtered.length ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<SearchX size={36} className="text-brand-500" />}
                  title="No restaurants found"
                  description="Try a different search term, clear the filters, or explore another category."
                  actionLabel="Clear filters"
                  onAction={clearAll}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm animate-slide-in-left overflow-y-auto bg-white p-5 shadow-float dark:bg-zinc-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClear={() => {
                setFilters(DEFAULT_FILTERS);
                if (categoryParam) setSearchParams({ sort: sortParam }, { replace: false });
              }}
              showTitle={false}
            />
            <button
              onClick={() => setFiltersOpen(false)}
              className="btn-primary mt-6 w-full py-3"
            >
              Show {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

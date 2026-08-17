import { Leaf, SlidersHorizontal } from 'lucide-react';
import { CUISINES } from '../data/constants';

const RATING_OPTIONS = [
  { value: 4.5, label: '4.5+ stars' },
  { value: 4.0, label: '4.0+ stars' },
];
const TIME_OPTIONS = [
  { value: 30, label: 'Under 30 min' },
  { value: 45, label: 'Under 45 min' },
];
const PRICE_OPTIONS = [
  { value: 'low', label: '₹0 – ₹300' },
  { value: 'mid', label: '₹300 – ₹600' },
  { value: 'high', label: '₹600+' },
];

export const DEFAULT_FILTERS = {
  rating: null,
  maxDelivery: null,
  priceRange: null,
  pureVeg: false,
  cuisines: [],
};

export default function FilterPanel({ filters, onChange, onClear, showTitle = true }) {
  const toggle = (key, value) => onChange({ ...filters, [key]: filters[key] === value ? null : value });

  const toggleCuisine = (c) => {
    const has = filters.cuisines.includes(c);
    onChange({
      ...filters,
      cuisines: has ? filters.cuisines.filter((x) => x !== c) : [...filters.cuisines, c],
    });
  };

  const activeCount =
    [filters.rating, filters.maxDelivery, filters.priceRange].filter(Boolean).length +
    (filters.pureVeg ? 1 : 0) +
    filters.cuisines.length;

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
            <SlidersHorizontal size={17} className="text-brand-600" /> Filters
          </h3>
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs font-bold text-brand-600 hover:underline">
              Clear all ({activeCount})
            </button>
          )}
        </div>
      )}

      {/* Rating */}
      <FilterGroup title="Rating">
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((o) => (
            <Pill key={o.value} active={filters.rating === o.value} onClick={() => toggle('rating', o.value)}>
              ⭐ {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      {/* Delivery time */}
      <FilterGroup title="Delivery time">
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((o) => (
            <Pill key={o.value} active={filters.maxDelivery === o.value} onClick={() => toggle('maxDelivery', o.value)}>
              🕐 {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      {/* Price */}
      <FilterGroup title="Price for two">
        <div className="flex flex-wrap gap-2">
          {PRICE_OPTIONS.map((o) => (
            <Pill key={o.value} active={filters.priceRange === o.value} onClick={() => toggle('priceRange', o.value)}>
              ₹ {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      {/* Pure veg */}
      <FilterGroup title="Dietary">
        <button
          onClick={() => onChange({ ...filters, pureVeg: !filters.pureVeg })}
          aria-pressed={filters.pureVeg}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
            filters.pureVeg
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'border-zinc-200 text-zinc-700 hover:border-emerald-400 dark:border-zinc-700 dark:text-zinc-300'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Leaf size={16} /> Pure vegetarian
          </span>
          <span
            className={`relative h-5 w-9 rounded-full transition-colors ${filters.pureVeg ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                filters.pureVeg ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </FilterGroup>

      {/* Cuisines */}
      <FilterGroup title="Cuisine">
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <Pill key={c} active={filters.cuisines.includes(c)} onClick={() => toggleCuisine(c)}>
              {c}
            </Pill>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{title}</h4>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-md'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

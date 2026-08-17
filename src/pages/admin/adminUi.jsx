import { useState } from 'react';
import { formatINR } from '../../utils/format';

/** Admin stat card with icon, value, label and accent color. */
export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    ember: 'bg-ember-50 text-ember-500 dark:bg-ember-500/10 dark:text-ember-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-2xl font-extrabold leading-tight text-zinc-900 dark:text-zinc-50">{value}</p>
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">{sub}</p>}
      </div>
    </div>
  );
}

/** Order status pill with a stable color per status. */
export function StatusBadge({ status }) {
  const map = {
    placed: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    accepted: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    preparing: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    ready: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    'picked-up': 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
    'out-for-delivery': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    delivered: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    cancelled: 'bg-ember-50 text-ember-500 dark:bg-ember-500/10 dark:text-ember-400',
  };
  const labels = {
    placed: 'Placed',
    accepted: 'Accepted',
    preparing: 'Preparing',
    ready: 'Ready',
    'picked-up': 'Picked up',
    'out-for-delivery': 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${map[status] || map.placed}`}>
      {labels[status] || status}
    </span>
  );
}

/** Role pill for users. */
export function RoleBadge({ role }) {
  const map = {
    customer: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    admin: 'bg-ember-50 text-ember-500 dark:bg-ember-500/10 dark:text-ember-400',
    restaurant: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    delivery: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${map[role] || map.customer}`}>
      {role}
    </span>
  );
}

/** Generic admin data table with sticky header + overflow handling. */
export function AdminTable({ head, children, empty, colSpan = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/40">
              {head.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {children}
          </tbody>
        </table>
      </div>
      {empty && <div className="px-4 py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">{empty}</div>}
    </div>
  );
}

/** Lightweight CSS bar chart — zero dependencies, responsive. */
export function BarChart({ data, valueKey, format = (v) => v, height = 160, color = 'from-brand-500 to-ember-500' }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d[valueKey]));

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d[valueKey] / max) * 100));
          return (
            <div
              key={d.date || i}
              className="group relative flex flex-1 flex-col items-center justify-end self-stretch"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === i && (
                <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
                  {format(d[valueKey])}
                </div>
              )}
              <div
                className={`w-full rounded-t-md bg-gradient-to-t ${color} transition-all duration-300 group-hover:opacity-80`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <div key={d.date || i} className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal ranked list (popular foods / restaurants). */
export function RankList({ items, valueKey, format = (v) => v, icon = '🍽️' }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey]));
  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-extrabold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <span aria-hidden="true" className="mr-1">{icon}</span>
                {item.name}
              </p>
              <span className="shrink-0 text-xs font-bold text-zinc-500 dark:text-zinc-400">{format(item[valueKey])}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-ember-500"
                style={{ width: `${Math.max(4, Math.round((item[valueKey] / max) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Small currency helper re-exported for admin pages. */
export const inr = formatINR;

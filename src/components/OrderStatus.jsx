import { Bike, Check, ChefHat, Home, PackageCheck, UtensilsCrossed } from 'lucide-react';
import { ORDER_STATUSES } from '../data/constants';

const ICONS = [PackageCheck, ChefHat, UtensilsCrossed, Check, Bike, Home];

export default function OrderStatus({ status }) {
  const currentIndex = ORDER_STATUSES.findIndex((s) => s.id === status);
  const progress = currentIndex === -1 ? 0 : (currentIndex / (ORDER_STATUSES.length - 1)) * 100;

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Order status</h3>
        {status !== 'delivered' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand-500" /> LIVE
          </span>
        )}
      </div>

      {/* Desktop horizontal timeline */}
      <div className="hidden sm:block">
        <div className="relative mb-2 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-ember-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {ORDER_STATUSES.map((s, i) => {
            const Icon = ICONS[i];
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={s.id} className="flex w-16 flex-col items-center gap-1.5 text-center">
                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active
                        ? 'border-brand-500 bg-brand-500 text-white shadow-lg animate-progress-pulse'
                        : 'border-zinc-200 bg-white text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-600'
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                </span>
                <span
                  className={`text-[10px] font-semibold leading-tight ${
                    done || active ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical timeline */}
      <div className="sm:hidden">
        {ORDER_STATUSES.map((s, i) => {
          const Icon = ICONS[i];
          const done = i < currentIndex;
          const active = i === currentIndex;
          const isLast = i === ORDER_STATUSES.length - 1;
          return (
            <div key={s.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active
                        ? 'border-brand-500 bg-brand-500 text-white animate-progress-pulse'
                        : 'border-zinc-200 bg-white text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-600'
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                </span>
                {!isLast && <span className={`my-1 w-0.5 flex-1 ${done ? 'bg-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800'}`} />}
              </div>
              <div className={`pb-5 ${isLast ? '' : ''}`}>
                <p className={`text-sm font-semibold ${done || active ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}>{s.label}</p>
                {active && status !== 'delivered' && (
                  <p className="mt-0.5 animate-pulse-soft text-xs text-brand-600">
                    {s.id === 'preparing' ? 'Your food is being cooked fresh 🔥' : 'We are on it…'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

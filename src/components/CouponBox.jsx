import { useEffect, useState } from 'react';
import { BadgePercent, Check, Tag, X } from 'lucide-react';
import { couponApi } from '../api/couponApi';
import { coupons as localCoupons } from '../data/coupons';
import { formatINR } from '../utils/format';

/**
 * Lists coupons (fetched from the backend, falling back to the bundled list)
 * and lets the user apply one. Validation happens in the parent via the
 * backend's /coupons/validate endpoint so the server stays authoritative.
 */
export default function CouponBox({ appliedCode, onApply, onRemove, error }) {
  const [code, setCode] = useState('');
  const [coupons, setCoupons] = useState(localCoupons);

  useEffect(() => {
    let cancelled = false;
    couponApi
      .list()
      .then(({ coupons: list }) => {
        if (!cancelled && Array.isArray(list) && list.length) setCoupons(list);
      })
      .catch(() => {
        // Keep the bundled list when the backend is unreachable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    onApply(code.trim().toUpperCase());
    setCode('');
  };

  return (
    <div className="card space-y-4 p-5">
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
        <BadgePercent size={18} className="text-brand-600" /> Coupons & Offers
      </h3>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          aria-label="Coupon code"
          className="input uppercase tracking-wider"
        />
        <button type="submit" className="btn-primary shrink-0 px-5">
          Apply
        </button>
      </form>

      {error && <p className="text-sm font-medium text-ember-500">{error}</p>}

      {appliedCode && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
            <Check size={16} /> {appliedCode} applied
          </span>
          <button onClick={onRemove} aria-label="Remove coupon" className="rounded-full p-1.5 text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-500/15">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {coupons.map((c) => {
          const applied = appliedCode === c.code;
          return (
            <div
              key={c.code}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                applied
                  ? 'border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  <Tag size={13} className="text-brand-600" /> {c.code}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {c.description || `${c.title} · min order ${formatINR(c.minOrder)}`}
                </p>
              </div>
              {applied ? (
                <span className="shrink-0 text-xs font-bold text-emerald-600">Applied ✓</span>
              ) : (
                <button
                  onClick={() => onApply(c.code)}
                  className="shrink-0 rounded-full border border-brand-500 px-3.5 py-1.5 text-xs font-bold text-brand-600 transition-all hover:bg-brand-500 hover:text-white active:scale-95"
                >
                  Apply
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Coupons are checked against your order total by the server before checkout.
      </p>
    </div>
  );
}

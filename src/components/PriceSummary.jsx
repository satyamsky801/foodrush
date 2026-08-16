import { formatINR } from '../utils/format';

export default function PriceSummary({ breakdown, showCouponRow = true }) {
  const { total, deliveryFee, tax, discount, coupon, grandTotal } = breakdown;

  return (
    <div className="space-y-2.5 text-sm">
      <Row label="Item total" value={formatINR(total)} />
      <Row label="Delivery fee" value={deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : formatINR(deliveryFee)} />
      <Row label="Taxes & charges (5% GST)" value={formatINR(tax)} />
      {showCouponRow && coupon && (
        <Row
          label={`Coupon applied (${coupon.code})`}
          value={<span className="font-bold text-emerald-600">− {formatINR(discount)}</span>}
        />
      )}
      {showCouponRow && !coupon && discount > 0 && (
        <Row label="Discount" value={<span className="font-bold text-emerald-600">− {formatINR(discount)}</span>} />
      )}
      <div className="mt-1 flex items-center justify-between border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-700">
        <span className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">To pay</span>
        <span className="font-display text-lg font-extrabold text-brand-600">{formatINR(grandTotal)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-800 dark:text-zinc-100">{value}</span>
    </div>
  );
}

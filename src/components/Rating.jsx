import { Star } from 'lucide-react';

export default function Rating({ value, count, size = 'sm', className = '' }) {
  const starSize = size === 'lg' ? 18 : size === 'xs' ? 12 : 14;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={`${value} out of 5`}>
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold text-white ${
          value >= 4 ? 'bg-emerald-600' : value >= 3.5 ? 'bg-lime-600' : 'bg-amber-500'
        }`}
      >
        <Star size={starSize} fill="currentColor" strokeWidth={0} />
        <span className="text-xs leading-none">{value.toFixed(1)}</span>
      </span>
      {count != null && <span className="text-xs text-zinc-500">({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count})</span>}
    </span>
  );
}

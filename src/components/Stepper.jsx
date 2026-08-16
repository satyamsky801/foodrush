import { Minus, Plus } from 'lucide-react';

export default function Stepper({ quantity, onChange, size = 'md' }) {
  const btn = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const text = size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-brand-500 bg-white text-brand-600 dark:bg-zinc-900">
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
        className={`${btn} flex items-center justify-center transition-colors hover:bg-brand-50 active:scale-90 dark:hover:bg-brand-500/10`}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className={`${text} w-8 select-none text-center font-bold`}>{quantity}</span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
        className={`${btn} flex items-center justify-center transition-colors hover:bg-brand-50 active:scale-90 dark:hover:bg-brand-500/10`}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

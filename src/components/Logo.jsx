import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export default function Logo({ to = '/', size = 'md' }) {
  const text = size === 'lg' ? 'text-2xl' : 'text-xl';
  const box = size === 'lg' ? 'h-10 w-10' : 'h-9 w-9';
  return (
    <Link to={to} className="group inline-flex items-center gap-2" aria-label="FoodRush home">
      <span
        className={`${box} flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-ember-500 shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105`}
      >
        <Flame size={size === 'lg' ? 22 : 19} className="text-white" fill="currentColor" strokeWidth={0} />
      </span>
      <span className={`${text} font-display font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50`}>
        Food<span className="text-gradient">Rush</span>
      </span>
    </Link>
  );
}

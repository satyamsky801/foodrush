import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function SectionHeader({ title, subtitle, actionLabel, actionTo }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          {actionLabel}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function EmptyState({ icon = '🛒', title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-4xl dark:bg-brand-500/10">
        <span aria-hidden="true">{icon}</span>
      </div>
      <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>}
      {(actionLabel && (actionTo || onAction)) && (
        actionTo ? (
          <Link to={actionTo} className="btn-primary mt-6 px-6 py-2.5">
            {actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className="btn-primary mt-6 px-6 py-2.5">
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

export default function CategoryCard({ category, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`group flex shrink-0 flex-col items-center gap-2 rounded-2xl border p-3 transition-all duration-200 active:scale-95 ${
        active
          ? 'border-brand-500 bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md'
          : 'border-zinc-100 bg-white text-zinc-700 shadow-chip hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand-500/50'
      }`}
      style={{ width: 104 }}
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform duration-200 group-hover:scale-110 ${
          active ? 'bg-white/20' : 'bg-brand-50 dark:bg-brand-500/10'
        }`}
        aria-hidden="true"
      >
        {category.emoji}
      </span>
      <span className="w-full truncate text-center text-xs font-semibold">{category.name}</span>
    </button>
  );
}

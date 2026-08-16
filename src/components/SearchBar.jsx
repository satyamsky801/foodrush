import { Search } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search for restaurants or dishes',
  className = '',
  autoFocus = false,
  size = 'md',
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} role="search">
      <Search
        size={size === 'lg' ? 20 : 18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full rounded-full border border-zinc-200 bg-white pr-4 text-zinc-900 shadow-chip outline-none transition-all placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
          size === 'lg' ? 'py-3.5 pl-12 text-base' : 'py-2.5 pl-11 text-sm'
        }`}
      />
    </form>
  );
}

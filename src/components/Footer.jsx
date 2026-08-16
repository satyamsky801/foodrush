import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Apple, Play } from 'lucide-react';
import Logo from './Logo';
import { useToast } from '../context/ToastContext';
import { categories } from '../data/categories';

const columns = [
  {
    title: 'Company',
    links: ['About us', 'Careers', 'Team', 'FoodRush One'],
  },
  {
    title: 'For you',
    links: ['Offers', 'Gift cards', 'Referrals', 'Contests'],
  },
  {
    title: 'Help',
    links: ['FAQs', 'Contact us', 'Terms & conditions', 'Privacy policy'],
  },
];

export default function Footer() {
  const toast = useToast();

  const announce = (label) => toast(`${label} — coming soon!`, 'info');

  return (
    <footer className="mt-16 border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="container-app grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Craving something? FoodRush delivers hot, fresh meals from the best restaurants in town —
            in minutes, not hours.
          </p>
          <div className="flex gap-2">
            {[
              { icon: Instagram, label: 'Instagram' },
              { icon: Twitter, label: 'Twitter' },
              { icon: Facebook, label: 'Facebook' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => announce(label)}
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-brand-500/10"
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((label) => (
                <li key={label}>
                  <button
                    onClick={() => announce(label)}
                    className="text-sm text-zinc-500 transition-colors hover:text-brand-600 dark:text-zinc-400"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Categories strip */}
      <div className="border-t border-zinc-100 py-6 dark:border-zinc-800">
        <div className="container-app">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Popular categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                to={`/restaurants?category=${c.id}`}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-400"
              >
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <div className="container-app flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">© 2026 FoodRush. Made with ❤️ for food lovers.</p>
          <div className="flex gap-2">
            <button
              onClick={() => announce('App Store')}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-left transition-colors hover:border-brand-400 dark:border-zinc-700"
            >
              <Apple size={20} className="text-zinc-700 dark:text-zinc-300" />
              <span className="text-xs leading-tight">
                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">Download on the</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-100">App Store</span>
              </span>
            </button>
            <button
              onClick={() => announce('Google Play')}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-left transition-colors hover:border-brand-400 dark:border-zinc-700"
            >
              <Play size={20} className="text-zinc-700 dark:text-zinc-300" />
              <span className="text-xs leading-tight">
                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">Get it on</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-100">Google Play</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

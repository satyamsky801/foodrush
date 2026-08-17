import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, ClipboardList, LogOut, Menu, Moon, Settings,
  Star, Sun, UtensilsCrossed, X,
} from 'lucide-react';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { initials } from '../../utils/format';
import { restaurantApi } from '../../api/restaurantApi';

const NAV = [
  { to: '/restaurant', end: true, label: 'Dashboard', icon: BarChart3 },
  { to: '/restaurant/orders', label: 'Orders', icon: ClipboardList },
  { to: '/restaurant/foods', label: 'Menu', icon: UtensilsCrossed },
  { to: '/restaurant/reviews', label: 'Reviews', icon: Star },
  { to: '/restaurant/analytics', label: 'Sales', icon: BarChart3 },
  { to: '/restaurant/profile', label: 'Profile', icon: Settings },
];

export default function RestaurantLayout() {
  const { user, logout } = useAuth();
  const { effectiveTheme, toggleTheme } = useSettings();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const sidebarRef = useRef(null);

  // Load the owner's restaurant profile for the sidebar header.
  useEffect(() => {
    let cancelled = false;
    restaurantApi
      .me()
      .then((res) => {
        if (!cancelled) setRestaurant(res.restaurant);
      })
      .catch(() => {
        /* sidebar just shows the account name */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the mobile sidebar on outside click or Escape.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setSidebarOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
          className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Restaurant identity */}
      <div className="mx-3 mb-2 rounded-2xl bg-brand-50/70 p-3.5 dark:bg-brand-500/10">
        <p className="truncate text-sm font-extrabold text-brand-700 dark:text-brand-400">
          {restaurant?.name || user?.name}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {restaurant?.area || 'Restaurant owner'}
        </p>
        {restaurant && (
          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              restaurant.isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${restaurant.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            {restaurant.isActive ? 'Open for orders' : 'Closed'}
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-ember-500 text-white shadow-md'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
              }`
            }
          >
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={17} /> Back to site
        </Link>
        <div className="mt-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ember-500 text-xs font-bold text-white">
            {initials(user?.name || 'O')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{user?.name}</p>
            <p className="truncate text-xs text-brand-600 dark:text-brand-400">Restaurant owner</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-ember-50 hover:text-ember-500 dark:hover:bg-ember-500/10"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar (slide-in) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <aside ref={sidebarRef} className="absolute inset-y-0 left-0 w-72 animate-slide-in-left bg-white shadow-float dark:bg-zinc-900">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-100 bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-full p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 sm:inline-flex">
              Restaurant Panel
            </span>
            <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {restaurant?.name || 'FoodRush Restaurant'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-all hover:bg-zinc-100 hover:text-brand-600 active:scale-90 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-brand-400"
          >
            {effectiveTheme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

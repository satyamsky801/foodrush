import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, MapPin, Moon, ShoppingCart, Sun, UserRound } from 'lucide-react';
import Logo from './Logo';
import SearchBar from './SearchBar';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initials } from '../utils/format';

const AREAS = ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar', 'MG Road', 'Basavanagudi'];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { effectiveTheme, toggleTheme } = useSettings();
  const toast = useToast();
  const [area, setArea] = useLocalStorage('foodrush_area', 'Indiranagar, Bengaluru');
  const [areaModal, setAreaModal] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the avatar dropdown on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const submitSearch = (q) => {
    const trimmed = (q || '').trim();
    navigate(trimmed ? `/restaurants?q=${encodeURIComponent(trimmed)}` : '/restaurants');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="container-app flex h-16 items-center gap-4">
        <Logo />

        {/* Location selector */}
        <button
          onClick={() => setAreaModal(true)}
          className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:inline-flex"
          aria-label="Change delivery location"
        >
          <MapPin size={17} className="text-brand-600" />
          <span className="max-w-[180px] truncate">{area}</span>
          <ChevronDown size={15} className="text-zinc-400 dark:text-zinc-500" />
        </button>

        {/* Desktop search */}
        <div className="mx-auto hidden w-full max-w-xl flex-1 lg:block">
          <SearchBar value={query} onChange={setQuery} onSubmit={submitSearch} size="sm" />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition-all hover:bg-zinc-100 hover:text-brand-600 active:scale-90 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-brand-400"
          >
            {effectiveTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link
            to="/cart"
            aria-label={`Cart with ${count} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-ember-500 px-1 text-[10px] font-bold text-white shadow">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ember-500 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                {initials(user.name)}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-56 animate-scale-in overflow-hidden rounded-2xl border border-zinc-100 bg-white py-1.5 shadow-float dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{user.name}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800">
                    <UserRound size={16} className="text-zinc-400 dark:text-zinc-500" /> My Profile
                  </Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800">
                    <ShoppingCart size={16} className="text-zinc-400 dark:text-zinc-500" /> My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800">
                      <LayoutDashboard size={16} className="text-zinc-400 dark:text-zinc-500" /> Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-ember-500 hover:bg-ember-50 dark:hover:bg-ember-500/10"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full bg-gradient-to-r from-brand-500 to-ember-500 px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-105 active:scale-95 sm:inline-flex"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search row */}
      <div className="border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800 lg:hidden">
        <SearchBar value={query} onChange={setQuery} onSubmit={submitSearch} size="sm" />
      </div>

      {/* Area picker modal */}
      <Modal open={areaModal} onClose={() => setAreaModal(false)} title="Choose your location" icon="📍">
        <div className="grid gap-2">
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => {
                setArea(`${a}, Bengaluru`);
                setAreaModal(false);
                toast(`Delivering to ${a}`);
              }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                area.startsWith(a)
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'border-zinc-200 text-zinc-700 hover:border-brand-300 hover:bg-brand-50/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10'
              }`}
            >
              <MapPin size={16} className={area.startsWith(a) ? 'text-brand-600' : 'text-zinc-400 dark:text-zinc-500'} />
              {a}
            </button>
          ))}
        </div>
      </Modal>
    </header>
  );
}

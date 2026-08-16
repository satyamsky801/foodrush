import { NavLink } from 'react-router-dom';
import { Home, ReceiptText, Search, ShoppingCart, UserRound } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/restaurants', label: 'Search', icon: Search },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function MobileNavbar() {
  const { count } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 md:hidden"
    >
      <div className="grid grid-cols-5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-600' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`
            }
          >
            <span className="relative">
              <Icon size={21} strokeWidth={2.2} />
              {to === '/cart' && count > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-ember-500 px-1 text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
              {to === '/profile' && !isAuthenticated && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import CartItem from '../components/CartItem';
import CouponBox from '../components/CouponBox';
import PriceSummary from '../components/PriceSummary';
import EmptyState from '../components/EmptyState';
import AppImage from '../components/AppImage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getRestaurant } from '../data/restaurants';
import { priceBreakdown } from '../utils/pricing';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const restaurant = getRestaurant(cart.restaurantId);
  const breakdown = useMemo(
    () => priceBreakdown(cart, restaurant, couponCode),
    [cart, restaurant, couponCode]
  );

  if (!cart.items?.length) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore restaurants and add your favourites!"
          actionLabel="Browse restaurants"
          actionTo="/restaurants"
        />
      </div>
    );
  }

  const applyCoupon = (code) => {
    const result = priceBreakdown(cart, restaurant, code);
    if (result.error) {
      setCouponError(result.error);
      return;
    }
    setCouponError('');
    setCouponCode(code);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponError('');
  };

  const goCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout', { state: { coupon: couponCode } });
  };

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">My Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm font-semibold text-ember-500 transition-colors hover:text-ember-600 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-5">
          {/* Restaurant banner */}
          {restaurant && (
            <Link
              to={`/restaurant/${restaurant.id}`}
              className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-card transition-all hover:border-brand-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-500/50"
            >
              <AppImage src={restaurant.image} alt={restaurant.name} emoji="🍽️" className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Ordering from</p>
                <p className="line-clamp-1 font-bold text-zinc-900 dark:text-zinc-50">{restaurant.name}</p>
                <p className="text-xs text-brand-600">Change restaurant →</p>
              </div>
            </Link>
          )}

          {cart.items.map((item) => (
            <CartItem
              key={item.key}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}

          <p className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <ShoppingBag size={14} />
            You can add more items from {restaurant?.name || 'this restaurant'}.
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <CouponBox
            appliedCode={couponCode}
            onApply={applyCoupon}
            onRemove={removeCoupon}
            error={couponError}
          />

          <div className="card p-5">
            <h3 className="mb-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Bill details</h3>
            <PriceSummary breakdown={breakdown} />
            <button onClick={goCheckout} className="btn-primary mt-5 w-full py-3.5">
              Proceed to Checkout <ArrowRight size={17} />
            </button>
            {!isAuthenticated && (
              <p className="mt-2.5 text-center text-xs text-zinc-400 dark:text-zinc-500">
                You'll be asked to log in before checkout.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import OrderCard from '../components/OrderCard';
import EmptyState from '../components/EmptyState';
import { useOrders, statusForOrder } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage() {
  const { orders, reorder } = useOrders();
  const { isAuthenticated } = useAuth();

  const { current, previous } = useMemo(() => {
    const current = orders.filter((o) => statusForOrder(o) !== 'delivered');
    const previous = orders.filter((o) => statusForOrder(o) === 'delivered');
    return { current, previous };
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon="🧾"
          title="Login to see your orders"
          description="Sign in to track current orders and reorder your favourites."
          actionLabel="Login / Sign Up"
          actionTo="/login?redirect=/orders"
        />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon="🛍️"
          title="No orders yet"
          description="When you place an order, it will show up here with live tracking and easy reordering."
          actionLabel="Order something tasty"
          actionTo="/restaurants"
        />
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">My Orders</h1>

      {current.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Current orders
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
            </span>
          </h2>
          <div className="space-y-4">
            {current.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      {previous.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Previous orders</h2>
          <div className="space-y-4">
            {previous.map((o) => (
              <OrderCard key={o.id} order={o} onReorder={reorder} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

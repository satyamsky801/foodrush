import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, MapPin, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { restaurantApi } from '../../api/restaurantApi';
import { StatusBadge, inr } from '../admin/adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils/format';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'New' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

/** Restaurant-side pipeline: placed → accepted → preparing → ready. */
const NEXT_ACTION = {
  placed: { status: 'accepted', label: 'Accept order', tone: 'bg-emerald-500 text-white hover:bg-emerald-600' },
  accepted: { status: 'preparing', label: 'Start preparing', tone: 'bg-brand-500 text-white hover:bg-brand-600' },
  preparing: { status: 'ready', label: 'Mark ready', tone: 'bg-violet-500 text-white hover:bg-violet-600' },
};

export default function RestaurantOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await restaurantApi.orders();
      setOrders(res.orders);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000); // gentle polling for new orders
    return () => clearInterval(timer);
  }, [load]);

  const advance = async (order, status) => {
    setBusyId(order._id);
    try {
      await restaurantApi.updateOrderStatus(order._id, status);
      toast(`Order ${order.orderId} → ${status.replace('-', ' ')}`);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!orders) return null;
    if (filter === 'all') return orders;
    return orders.filter((o) => o.orderStatus === filter);
  }, [orders, filter]);

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load orders</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
        <button onClick={load} className="btn-primary mx-auto mt-4 px-5 py-2 text-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Orders</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {orders ? `${orders.length} total — manage the kitchen pipeline` : ''}
          </p>
        </div>
        <button onClick={load} className="btn-secondary px-4 py-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
              filter === key
                ? 'bg-gradient-to-r from-brand-500 to-ember-500 text-white shadow-md'
                : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-brand-600 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700'
            }`}
          >
            {label}
            {orders && key !== 'all' && (
              <span className="ml-1.5 opacity-70">({orders.filter((o) => o.orderStatus === key).length})</span>
            )}
          </button>
        ))}
      </div>

      {!filtered ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl">🍽️</p>
          <p className="mt-3 font-semibold text-zinc-800 dark:text-zinc-100">No orders here</p>
          <p className="mt-1 text-sm text-zinc-400">
            {filter === 'all' ? 'New orders will appear here in real time.' : `No ${filter} orders right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const action = NEXT_ACTION[order.orderStatus];
            return (
              <div key={order._id} className="card overflow-hidden">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{order.orderId}</span>
                      <StatusBadge status={order.orderStatus} />
                      <span className="text-xs text-zinc-400">{timeAgo(order.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {order.user?.name} · {order.user?.phone} · {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-extrabold text-zinc-900 dark:text-zinc-50">{inr(order.breakdown?.grandTotal)}</span>
                    {action ? (
                      <button
                        onClick={() => advance(order, action.status)}
                        disabled={busyId === order._id}
                        className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60 ${action.tone}`}
                      >
                        {busyId === order._id ? '…' : action.label}
                      </button>
                    ) : null}
                    <button
                      onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                      aria-label={expanded === order._id ? 'Collapse order' : 'Expand order'}
                      className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <ChevronDown size={16} className={`transition-transform ${expanded === order._id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === order._id && (
                  <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                <span className="text-xs text-zinc-400">×{item.quantity}</span>
                                <span className={`inline-block h-2.5 w-2.5 rounded-sm ${item.veg ? 'bg-emerald-500' : 'bg-ember-500'}`} />
                                {item.name}
                              </span>
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{inr((item.unitPrice + (item.addonTotal || 0) + (item.customTotal || 0)) * item.quantity)}</span>
                            </div>
                            {item.customizations?.length > 0 && (
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {item.customizations.map((c) => `${c.optionName}`).join(', ')}
                              </p>
                            )}
                            {item.addons?.length > 0 && (
                              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                + {item.addons.map((a) => a.name).join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-zinc-400">Delivery address</p>
                        <div className="flex items-start gap-2 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-brand-500" />
                          <span>
                            {order.address?.name} · {order.address?.street}, {order.address?.area}, {order.address?.city} {order.address?.pincode}
                            {order.address?.landmark ? ` (${order.address.landmark})` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50">
                        <div className="flex justify-between py-0.5 text-zinc-500 dark:text-zinc-400">
                          <span>Item total</span><span>{inr(order.breakdown?.total)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 text-zinc-500 dark:text-zinc-400">
                          <span>Delivery</span><span>{inr(order.breakdown?.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 text-zinc-500 dark:text-zinc-400">
                          <span>GST</span><span>{inr(order.breakdown?.tax)}</span>
                        </div>
                        {order.breakdown?.discount > 0 && (
                          <div className="flex justify-between py-0.5 text-emerald-600 dark:text-emerald-400">
                            <span>Discount</span><span>−{inr(order.breakdown.discount)}</span>
                          </div>
                        )}
                        <div className="mt-1 flex justify-between border-t border-zinc-200 pt-2 font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
                          <span>Total</span><span>{inr(order.breakdown?.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { StatusBadge, AdminTable, inr } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import { ORDER_STATUSES } from '../../data/constants';
import { timeAgo } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'placed', label: 'Placed' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'picked-up', label: 'Picked up' },
  { id: 'out-for-delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_OPTIONS = [...ORDER_STATUSES.map((s) => s.id), 'cancelled'];

export default function AdminOrdersPage() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async (status) => {
    try {
      const res = await adminApi.allOrders(status ? { status } : {});
      setOrders(res.orders);
      setStats(res.stats);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const changeStatus = async (id, status) => {
    setUpdating(id);
    try {
      await adminApi.updateOrderStatus(id, status);
      toast(`Order marked ${status.replace(/-/g, ' ')}`);
      await load(filter);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUpdating(null);
    }
  };

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load orders</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!orders) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Orders</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {stats ? `${stats.pending} pending · ${stats.completed} completed · ${inr(stats.revenue)} revenue` : ''}
        </p>
      </div>

      {/* Status filter chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
              filter === s.id
                ? 'bg-gradient-to-r from-brand-500 to-ember-500 text-white shadow-md'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:border-brand-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand-500/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AdminTable
        head={['Order', 'Customer', 'Restaurant', 'Items', 'Total', 'Payment', 'Status', 'Placed', 'Actions']}
        empty={orders.length === 0 ? 'No orders match this filter.' : ''}
        colSpan={9}
      >
        {orders.map((o) => (
          <tr key={o._id} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
            <td className="px-4 py-3 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-200">#{o.orderId}</td>
            <td className="px-4 py-3">
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">{o.user?.name || '—'}</p>
              <p className="text-xs text-zinc-400">{o.user?.email || ''}</p>
            </td>
            <td className="max-w-[160px] truncate px-4 py-3 text-zinc-700 dark:text-zinc-200">{o.restaurant?.name || '—'}</td>
            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{o.items?.length || 0}</td>
            <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-50">{inr(o.breakdown?.grandTotal || 0)}</td>
            <td className="px-4 py-3">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {o.paymentMethod}
              </span>
            </td>
            <td className="px-4 py-3"><StatusBadge status={o.orderStatus} /></td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{timeAgo(new Date(o.createdAt).getTime())}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <select
                  value={o.orderStatus}
                  disabled={updating === o._id}
                  onChange={(e) => changeStatus(o._id, e.target.value)}
                  className="input w-36 py-1.5 text-xs"
                  aria-label={`Change status for order ${o.orderId}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                  ))}
                </select>
                <Link
                  to={`/order/${o._id}`}
                  aria-label={`View order ${o.orderId}`}
                  className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-brand-600 dark:hover:bg-zinc-800"
                >
                  <ChevronRight size={16} />
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

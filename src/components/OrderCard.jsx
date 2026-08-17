import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, Truck } from 'lucide-react';
import AppImage from './AppImage';
import { ORDER_STATUSES } from '../data/constants';
import { formatINR, timeAgo } from '../utils/format';

const STATUS_STYLES = {
  placed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  accepted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  preparing: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  ready: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  'picked-up': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  'out-for-delivery': 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

export default function OrderCard({ order, onReorder }) {
  const status = order.orderStatus || 'placed';
  const statusLabel = ORDER_STATUSES.find((s) => s.id === status)?.label || status;
  const itemNames = order.items.map((it) => `${it.name} ×${it.quantity}`).join(', ');
  const finished = status === 'delivered' || status === 'cancelled';

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <AppImage src={order.restaurantImage} alt={order.restaurantName} emoji="🍽️" className="h-16 w-16 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{order.restaurantName}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[status] || STATUS_STYLES.placed}`}>
              {statusLabel}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{itemNames}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span>Order #{order.id}</span>
            <span>·</span>
            <span>{timeAgo(order.placedAt)}</span>
            <span>·</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{formatINR(order.breakdown.grandTotal)}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {status === 'delivered' && onReorder && (
            <button onClick={() => onReorder(order._id)} className="btn-secondary px-4 py-2 text-sm">
              <RefreshCw size={15} /> Reorder
            </button>
          )}
          {!finished ? (
            <Link to={`/order/${order._id}`} className="btn-primary px-4 py-2 text-sm">
              <Truck size={15} /> Track
            </Link>
          ) : (
            <Link to={`/order/${order._id}`} className="btn-secondary px-4 py-2 text-sm">
              View details <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

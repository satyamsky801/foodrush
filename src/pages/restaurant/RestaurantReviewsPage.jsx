import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { restaurantApi } from '../../api/restaurantApi';
import { Skeleton } from '../../components/LoadingSkeleton';
import { timeAgo } from '../../utils/format';
import Rating from '../../components/Rating';

export default function RestaurantReviewsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const meRes = await restaurantApi.me();
      const reviews = await restaurantApi.reviews(meRes.restaurant._id);
      setData({ restaurant: meRes.restaurant, ...reviews });
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load reviews</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!data) return <Skeleton className="h-96 rounded-2xl" />;

  const { restaurant, reviews, distribution } = data;
  const total = reviews.length;
  const avg = total
    ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    : restaurant.rating?.toFixed?.(1) || '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Reviews</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">What customers say about {restaurant.name}.</p>
      </div>

      {/* Rating summary */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="font-display text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">{avg}</p>
            <Rating value={Number(avg) || 0} size="sm" className="mt-1 justify-center" />
            <p className="mt-1 text-xs text-zinc-400">{total} review{total === 1 ? '' : 's'}</p>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution?.[star] || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="flex w-8 items-center gap-1 font-bold text-zinc-600 dark:text-zinc-300">
                    {star} <Star size={11} className="fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-ember-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-zinc-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-3 font-semibold text-zinc-800 dark:text-zinc-100">No reviews yet</p>
          <p className="mt-1 text-sm text-zinc-400">Reviews appear here after customers receive their orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {(review.user?.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{review.user?.name || 'Customer'}</p>
                    <p className="text-xs text-zinc-400">{timeAgo(review.createdAt)}</p>
                  </div>
                </div>
                <Rating value={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{review.comment}</p>
              )}
              {review.food && (
                <p className="mt-2 text-xs font-semibold text-zinc-400">About: {review.food.name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

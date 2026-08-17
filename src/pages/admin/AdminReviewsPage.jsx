import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminTable } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';
import AppImage from '../../components/AppImage';
import { initials, timeAgo } from '../../utils/format';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await adminApi.allReviews();
      setReviews(res.reviews);
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Reviews</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{reviews ? `${reviews.length} reviews across FoodRush` : ''}</p>
      </div>

      {!reviews ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <AdminTable
          head={['Reviewer', 'Restaurant', 'Item', 'Rating', 'Comment', 'When']}
          empty={reviews.length === 0 ? 'No reviews yet — they appear after delivered orders.' : ''}
          colSpan={6}
        >
          {reviews.map((r) => (
            <tr key={r._id} className="align-top transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ember-500 text-xs font-bold text-white">
                    {initials(r.user?.name || '?')}
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-100">{r.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-zinc-400">{r.user?.email || ''}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {r.restaurant ? (
                  <Link to={`/restaurant/${r.restaurant.slug}`} className="flex items-center gap-2 font-semibold text-zinc-800 hover:text-brand-600 dark:text-zinc-100 dark:hover:text-brand-400">
                    <AppImage src={r.restaurant.image} alt="" emoji="🍽️" className="h-8 w-8 rounded-lg" />
                    {r.restaurant.name}
                  </Link>
                ) : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{r.food?.name || <span className="text-xs text-zinc-400">Restaurant</span>}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {r.rating}.0
                </span>
              </td>
              <td className="max-w-[260px] px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                {r.comment || <span className="italic text-zinc-400">No comment</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{timeAgo(new Date(r.createdAt).getTime())}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

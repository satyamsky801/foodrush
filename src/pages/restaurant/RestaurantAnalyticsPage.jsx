import { useEffect, useState } from 'react';
import { IndianRupee, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { restaurantApi } from '../../api/restaurantApi';
import { StatCard, BarChart, RankList, inr } from '../admin/adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';

export default function RestaurantAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    restaurantApi
      .analytics()
      .then((res) => {
        if (!cancelled) setAnalytics(res.analytics);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load sales data</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const n = (k) => analytics.byStatus[k] || 0;
  const completed = n('delivered');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Sales analytics</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">All figures are computed server-side from your orders.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Total orders" value={analytics.totalOrders} tone="brand" />
        <StatCard icon={IndianRupee} label="Total revenue" value={inr(analytics.revenue)} tone="emerald" />
        <StatCard icon={TrendingUp} label="Avg order value" value={inr(analytics.aov)} tone="violet" />
        <StatCard icon={Star} label="Completed orders" value={completed} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card min-w-0 p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Daily orders — last 14 days</h2>
          </div>
          <BarChart data={analytics.daily} valueKey="orders" format={(v) => `${v} orders`} />
        </div>

        <div className="card min-w-0 p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Daily revenue — last 14 days</h2>
          </div>
          <BarChart data={analytics.daily} valueKey="revenue" format={(v) => inr(v)} color="from-emerald-500 to-teal-500" />
        </div>
      </div>

      <div className="card min-w-0 p-5">
        <h2 className="mb-5 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Popular foods</h2>
        {analytics.popularFoods.length ? (
          <RankList items={analytics.popularFoods} valueKey="qty" format={(v) => `${v} sold`} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-400">No orders yet — your bestsellers will show up here.</p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Clock, IndianRupee, ShoppingBag, Star, TrendingUp, UtensilsCrossed,
} from 'lucide-react';
import { restaurantApi } from '../../api/restaurantApi';
import { StatCard, BarChart, RankList, inr } from '../admin/adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';

export default function RestaurantDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [analyticsRes, profileRes] = await Promise.all([
          restaurantApi.analytics(),
          restaurantApi.me(),
        ]);
        if (cancelled) return;
        setAnalytics(analyticsRes.analytics);
        setProfile(profileRes.restaurant);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-3xl">😕</p>
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load your dashboard</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!analytics || !profile) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const n = (k) => analytics.byStatus[k] || 0;
  const pending = n('placed');
  const preparing = n('preparing') + n('accepted');
  const completed = n('delivered');
  const totalOrders = pending + preparing + completed + n('ready') + n('picked-up') + n('out-for-delivery') + n('cancelled');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {profile.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {profile.area || 'Restaurant'} · {profile.cuisine?.join(', ') || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/restaurant/orders" className="btn-secondary px-4 py-2 text-sm">
            <ClipboardList size={15} /> Incoming orders
          </Link>
          <Link to="/restaurant/foods" className="btn-primary px-4 py-2 text-sm">
            <UtensilsCrossed size={15} /> Manage menu
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Today's orders" value={analytics.today.orders} tone="brand" />
        <StatCard icon={IndianRupee} label="Today's revenue" value={inr(analytics.today.revenue)} tone="emerald" />
        <StatCard icon={Clock} label="Pending orders" value={pending} tone="amber" />
        <StatCard icon={TrendingUp} label="Preparing" value={preparing} tone="violet" />
        <StatCard icon={ClipboardList} label="Completed" value={completed} tone="emerald" />
        <StatCard icon={UtensilsCrossed} label="Menu items" value={analytics.menuCount} tone="amber" />
        <StatCard
          icon={Star}
          label="Restaurant rating"
          value={profile.rating ? `${profile.rating} ★` : '—'}
          tone="brand"
        />
        <StatCard
          icon={IndianRupee}
          label="Total revenue"
          value={inr(analytics.revenue)}
          tone="violet"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card min-w-0 p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Daily orders — last 14 days</h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {analytics.daily.reduce((s, d) => s + d.orders, 0)} orders
            </span>
          </div>
          <BarChart data={analytics.daily} valueKey="orders" format={(v) => `${v} orders`} />
        </div>

        <div className="card min-w-0 p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Daily revenue — last 14 days</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              {inr(analytics.daily.reduce((s, d) => s + d.revenue, 0))}
            </span>
          </div>
          <BarChart data={analytics.daily} valueKey="revenue" format={(v) => inr(v)} color="from-emerald-500 to-teal-500" />
        </div>

        <div className="card min-w-0 p-5">
          <h2 className="mb-5 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Popular foods</h2>
          {analytics.popularFoods.length ? (
            <RankList items={analytics.popularFoods} valueKey="qty" format={(v) => `${v} sold`} />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">No orders yet — sales will appear here.</p>
          )}
        </div>

        <div className="card min-w-0 p-5">
          <h2 className="mb-5 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Quick actions</h2>
          <div className="grid gap-3">
            {[
              { to: '/restaurant/orders', label: 'View incoming orders', icon: ClipboardList },
              { to: '/restaurant/foods', label: 'Add a new dish', icon: UtensilsCrossed },
              { to: '/restaurant/reviews', label: 'Read customer reviews', icon: Star },
              { to: '/restaurant/analytics', label: 'Full sales report', icon: TrendingUp },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3.5 text-sm font-bold text-zinc-800 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-zinc-800 dark:text-zinc-100 dark:hover:border-brand-500/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Icon size={16} />
                </span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

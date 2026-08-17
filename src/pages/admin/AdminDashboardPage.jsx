import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Clock, IndianRupee, ShoppingBag, Star, TrendingUp, UsersRound,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { StatCard, BarChart, RankList, inr } from './adminUi';
import { Skeleton } from '../../components/LoadingSkeleton';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dash, chartRes] = await Promise.all([adminApi.dashboard(), adminApi.charts()]);
        if (cancelled) return;
        setStats(dash.stats);
        setCharts(chartRes.charts);
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
        <p className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">Could not load the dashboard</p>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!stats || !charts) {
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

  // Backend only reports statuses that exist, so default every key to 0.
  const n = (k) => stats.byStatus[k] || 0;
  const pending = n('placed') + n('accepted') + n('preparing') + n('ready') +
    n('picked-up') + n('out-for-delivery');
  const completed = n('delivered');
  const totalOrders = pending + completed + n('cancelled');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Live overview of FoodRush performance.</p>
        </div>
        <Link to="/admin/orders" className="btn-secondary px-4 py-2 text-sm">
          <ClipboardList size={15} /> View all orders
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={UsersRound} label="Total Users" value={stats.users} tone="brand" />
        <StatCard icon={ShoppingBag} label="Restaurants" value={stats.restaurants} tone="violet" />
        <StatCard icon={ClipboardList} label="Total Orders" value={totalOrders} tone="amber" />
        <StatCard icon={IndianRupee} label="Total Revenue" value={inr(stats.revenue)} tone="emerald" />
        <StatCard icon={Clock} label="Pending Orders" value={pending} tone="amber" />
        <StatCard icon={TrendingUp} label="Completed" value={completed} tone="emerald" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card min-w-0 p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Daily orders — last 14 days</h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {charts.daily.reduce((s, d) => s + d.orders, 0)} orders
            </span>
          </div>
          <BarChart data={charts.daily} valueKey="orders" format={(v) => `${v} orders`} />
        </div>

        <div className="card min-w-0 p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Daily revenue — last 14 days</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              {inr(charts.daily.reduce((s, d) => s + d.revenue, 0))}
            </span>
          </div>
          <BarChart data={charts.daily} valueKey="revenue" format={(v) => inr(v)} color="from-emerald-500 to-teal-500" />
        </div>

        <div className="card min-w-0 p-5">
          <h2 className="mb-5 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Popular foods</h2>
          {charts.popularFoods.length ? (
            <RankList items={charts.popularFoods} valueKey="qty" format={(v) => `${v} sold`} />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">No orders yet — sales will appear here.</p>
          )}
        </div>

        <div className="card min-w-0 p-5">
          <h2 className="mb-5 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Popular restaurants</h2>
          {charts.popularRestaurants.length ? (
            <RankList items={charts.popularRestaurants} valueKey="orders" format={(v) => `${v} orders`} icon="🏪" />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">No orders yet — sales will appear here.</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { to: '/admin/restaurants', label: 'Manage restaurants', icon: ShoppingBag },
          { to: '/admin/foods', label: 'Manage menu items', icon: ClipboardList },
          { to: '/admin/users', label: 'Manage users', icon: UsersRound },
          { to: '/admin/reviews', label: 'View reviews', icon: Star },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:hover:border-brand-500/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Icon size={18} />
            </span>
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

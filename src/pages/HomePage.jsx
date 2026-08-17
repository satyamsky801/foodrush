import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bike, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck, Timer, Zap } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CategoryCard from '../components/CategoryCard';
import RestaurantCard from '../components/RestaurantCard';
import FoodCard from '../components/FoodCard';
import SectionHeader from '../components/SectionHeader';
import { SkeletonFoodCard, SkeletonRestaurantCard } from '../components/LoadingSkeleton';
import { useFetch } from '../hooks/useFetch';
import { categories } from '../data/categories';
import { offerBanners } from '../data/offers';
import { restaurantApi } from '../api/restaurantApi';
import { foodApi } from '../api/foodApi';
import { mapRestaurant, mapFood } from '../api/normalizers';
import { useSettings } from '../context/SettingsContext';

const FEATURES = [
  { icon: Zap, title: 'Super-fast delivery', text: 'Hot food at your door in 30 minutes or less.' },
  { icon: Bike, title: 'Live order tracking', text: 'Watch your order move from kitchen to doorstep.' },
  { icon: ShieldCheck, title: 'Fresh & hygienic', text: 'Sealed packaging and quality-checked kitchens.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);

  // Load restaurants + recommended dishes from the backend.
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const [restaurantRes, foodRes] = await Promise.all([
        restaurantApi.list(),
        foodApi.list(),
      ]);
      return {
        restaurants: (restaurantRes.restaurants || []).map(mapRestaurant),
        recommended: (foodRes.foods || [])
          .filter((f) => f.isRecommended)
          .slice(0, 12)
          .map((f) => mapFood(f, f.restaurant)),
      };
    },
    [],
    { enabled: true }
  );

  // Auto-advance the offer carousel.
  useEffect(() => {
    const t = setInterval(() => setBannerIndex((i) => (i + 1) % offerBanners.length), 4000);
    return () => clearInterval(t);
  }, []);

  const submitSearch = (q) => {
    const trimmed = (q || '').trim();
    navigate(trimmed ? `/restaurants?q=${encodeURIComponent(trimmed)}` : '/restaurants');
  };

  const restaurants = data?.restaurants || [];
  const popularRestaurants = restaurants.filter((r) => r.featured);
  const topRatedRestaurants = restaurants.filter((r) => r.topRated);

  // Veg mode hides non-veg restaurants & dishes.
  const filteredPopular = settings.vegMode ? popularRestaurants.filter((r) => r.pureVeg) : popularRestaurants;
  const filteredTop = settings.vegMode ? topRatedRestaurants.filter((r) => r.pureVeg) : topRatedRestaurants;
  const recommendedFoods = (data?.recommended || []).filter((f) => (settings.vegMode ? f.veg : true));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-ember-500">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="container-app relative py-14 text-center sm:py-20">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            🍕 50% OFF your first order with code <span className="underline decoration-dotted">WELCOME50</span>
          </span>
          <h1 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Cravings delivered <span className="underline decoration-white/40 decoration-4 underline-offset-8">fast &amp; fresh</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            Order from the best restaurants in your city — biryani, pizza, dosas and more, straight to your doorstep.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar value={query} onChange={setQuery} onSubmit={submitSearch} size="lg" placeholder="Search for restaurants or dishes" />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-white/80">
            <span className="inline-flex items-center gap-1.5"><Timer size={14} /> Avg. delivery 25 min</span>
            <span className="inline-flex items-center gap-1.5">⭐ 4.5+ rated kitchens</span>
            <span className="inline-flex items-center gap-1.5">🚀 10,000+ orders delivered</span>
          </div>
        </div>
      </section>

      {/* Offer carousel */}
      <section className="container-app -mt-8">
        <div className="relative">
          <div className="overflow-hidden rounded-3xl shadow-float">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
            >
              {offerBanners.map((b) => (
                <div key={b.id} className="w-full shrink-0">
                  <div className={`relative flex h-44 items-center overflow-hidden bg-gradient-to-r sm:h-52 ${b.gradient}`}>
                    <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                    <div className="relative z-10 ml-8 sm:ml-14">
                      <h3 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{b.title}</h3>
                      <p className="mt-1 text-sm font-medium text-white/90 sm:text-base">{b.subtitle}</p>
                      <button
                        onClick={() => navigate(`/restaurants?q=${b.code}`)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-bold text-brand-600 shadow-md transition-transform hover:scale-105 active:scale-95"
                      >
                        Order now <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrows */}
          <button
            onClick={() => setBannerIndex((bannerIndex - 1 + offerBanners.length) % offerBanners.length)}
            aria-label="Previous offer"
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-110 sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setBannerIndex((bannerIndex + 1) % offerBanners.length)}
            aria-label="Next offer"
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-110 sm:flex"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
            {offerBanners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setBannerIndex(i)}
                aria-label={`Go to offer ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? 'w-6 bg-brand-500' : 'w-1.5 bg-zinc-300 dark:bg-zinc-600'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app mt-16">
        <SectionHeader title="What are you craving?" subtitle="Browse by category" />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {categories.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              onClick={() => navigate(`/restaurants?category=${c.id}`)}
            />
          ))}
        </div>
      </section>

      {/* Popular restaurants */}
      <section className="container-app mt-14">
        <SectionHeader
          title="Popular restaurants near you"
          subtitle="Handpicked favourites our users love"
          actionLabel="View all"
          actionTo="/restaurants"
        />
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <SkeletonRestaurantCard key={i} />)}
          </div>
        ) : error ? (
          <ApiErrorCard onRetry={refetch} />
        ) : filteredPopular.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPopular.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No restaurants match your veg mode. Toggle it off in Profile → Settings.
          </p>
        )}
      </section>

      {/* Recommended dishes */}
      <section className="bg-white py-14 dark:bg-zinc-900">
        <div className="container-app">
          <SectionHeader
            title="Recommended for you"
            subtitle="Chef's picks that everyone is talking about"
            actionLabel="Explore restaurants"
            actionTo="/restaurants"
          />
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {[...Array(6)].map((_, i) => <SkeletonFoodCard key={i} />)}
            </div>
          ) : error ? (
            <ApiErrorCard onRetry={refetch} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {recommendedFoods.map((f) => <FoodCard key={f.id} food={f} showRestaurant />)}
            </div>
          )}
        </div>
      </section>

      {/* Top rated near you */}
      <section className="container-app mt-14">
        <SectionHeader
          title="Top rated near you"
          subtitle="Restaurants loved by thousands of foodies"
          actionLabel="View all"
          actionTo="/restaurants?sort=rating"
        />
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => <SkeletonRestaurantCard key={i} />)}
          </div>
        ) : error ? (
          <ApiErrorCard onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTop.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </section>

      {/* Why FoodRush */}
      <section className="container-app mt-16">
        <div className="grid gap-4 rounded-3xl bg-gradient-to-br from-brand-50 to-ember-50 p-6 dark:from-brand-950 dark:to-ember-950 sm:p-10 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-start gap-3 rounded-2xl bg-white/80 p-5 backdrop-blur-sm dark:bg-zinc-900/80">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-ember-500 text-white shadow-md">
                <Icon size={20} />
              </span>
              <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="container-app mt-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-ember-500 px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">Hungry? Let's fix that.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
            Browse restaurants, add your favourites and get food delivered in minutes.
          </p>
          <Link to="/restaurants" className="btn mt-6 bg-white px-8 py-3 text-sm font-bold text-brand-600 shadow-lg transition-transform hover:scale-105 active:scale-95">
            Start ordering <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ApiErrorCard({ onRetry }) {
  return (
    <div className="rounded-2xl border border-dashed border-ember-300 bg-ember-50/50 p-8 text-center dark:border-ember-500/40 dark:bg-ember-500/10">
      <p className="text-3xl">📡</p>
      <p className="mt-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Couldn't load restaurants</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Make sure the backend is running: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">cd backend && npm run dev</code>
      </p>
      <button onClick={onRetry} className="btn-secondary mt-4 px-5 py-2.5 text-sm">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
}

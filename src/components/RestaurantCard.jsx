import { Link } from 'react-router-dom';
import { Bike, Clock, Heart, Wallet } from 'lucide-react';
import AppImage from './AppImage';
import Rating from './Rating';
import VegIndicator from './VegIndicator';
import { useFavorites } from '../context/FavoritesContext';
import { formatINR } from '../utils/format';

export default function RestaurantCard({ restaurant }) {
  const { isRestaurantFav, toggleRestaurant } = useFavorites();
  const fav = isRestaurantFav(restaurant.id);

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="group card block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <AppImage
          src={restaurant.image}
          alt={restaurant.name}
          emoji="🍽️"
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        {restaurant.offers?.[0] && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-600/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {restaurant.offers[0]}
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleRestaurant(restaurant.id, restaurant.name);
          }}
          aria-label={fav ? `Remove ${restaurant.name} from favourites` : `Add ${restaurant.name} to favourites`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 dark:bg-zinc-900/90"
        >
          <Heart size={17} className={fav ? 'fill-ember-500 text-ember-500' : 'text-zinc-500 dark:text-zinc-400'} />
        </button>
        <div className="absolute bottom-3 left-3">
          <VegIndicator veg={restaurant.pureVeg} size={12} />
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{restaurant.name}</h3>
          <Rating value={restaurant.rating} count={restaurant.ratingCount} />
        </div>
        <p className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{restaurant.cuisine.join(', ')}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} className="text-brand-600" />
            {restaurant.deliveryTime}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bike size={13} className="text-brand-600" />
            {restaurant.deliveryFee === 0 ? 'Free' : `₹${restaurant.deliveryFee}`}
          </span>
          <span className="inline-flex items-center gap-1">
            <Wallet size={13} className="text-brand-600" />
            {formatINR(restaurant.priceForTwo)} for two
          </span>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{restaurant.area}</p>
      </div>
    </Link>
  );
}

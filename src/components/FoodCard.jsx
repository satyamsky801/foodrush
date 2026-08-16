import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import AppImage from './AppImage';
import Rating from './Rating';
import VegIndicator from './VegIndicator';
import Stepper from './Stepper';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { formatINR } from '../utils/format';
import { categoryEmoji } from '../utils/images';

/**
 * Vertical food card used on home, search results and restaurant menus.
 * Dishes with required customizations route to the Food Details page
 * ("CUSTOMISE") instead of being added blindly.
 */
export default function FoodCard({ food, showRestaurant = false }) {
  const navigate = useNavigate();
  const { cart, addItem, updateQuantity } = useCart();
  const { isFoodFav, toggleFood } = useFavorites();

  const needsCustomisation = food.customizations?.some((c) => c.required);
  const cartLine = cart.items?.find(
    (it) => it.id === food.id && !it.addons?.length && !it.customizations?.length
  );

  const handleAdd = () => {
    if (needsCustomisation) {
      navigate(`/food/${food.restaurantId}/${food.id}`);
      return;
    }
    addItem(food, { quantity: 1 });
  };

  const fav = isFoodFav(food.id);

  return (
    <div className="group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden">
        <AppImage
          src={food.image}
          alt={food.name}
          emoji={categoryEmoji(food.category)}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <VegIndicator veg={food.veg} size={12} />
        </div>
        {food.isBestseller && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600 shadow-sm backdrop-blur-sm dark:bg-zinc-900/90">
            Bestseller
          </span>
        )}
        <button
          onClick={() => toggleFood(food.id, food.name)}
          aria-label={fav ? `Remove ${food.name} from favourites` : `Add ${food.name} to favourites`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 dark:bg-zinc-900/90"
        >
          <Heart size={15} className={fav ? 'fill-ember-500 text-ember-500' : 'text-zinc-500 dark:text-zinc-400'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-50">{food.name}</h3>
        </div>
        {food.description && (
          <p className="line-clamp-2 mb-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{food.description}</p>
        )}
        {showRestaurant && (
          <button
            onClick={() => navigate(`/restaurant/${food.restaurantId}`)}
            className="mb-2 self-start text-xs font-semibold text-brand-600 hover:underline"
          >
            {food.restaurantName} →
          </button>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">{formatINR(food.price)}</p>
            <Rating value={food.rating} size="xs" />
          </div>
          {cartLine ? (
            <Stepper quantity={cartLine.quantity} onChange={(q) => updateQuantity(cartLine.key, q)} />
          ) : (
            <button
              onClick={handleAdd}
              className="rounded-full border border-brand-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-600 transition-all hover:bg-brand-500 hover:text-white active:scale-95"
            >
              {needsCustomisation ? 'Customise' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

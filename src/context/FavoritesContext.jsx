import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/constants';
import { useToast } from './ToastContext';

const FavoritesContext = createContext(null);

export const useFavorites = () => useContext(FavoritesContext);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.favorites, {
    restaurants: [],
    foods: [],
  });
  const toast = useToast();

  const toggleRestaurant = useCallback(
    (id) => {
      setFavorites((prev) => {
        const has = prev.restaurants.includes(id);
        return {
          ...prev,
          restaurants: has ? prev.restaurants.filter((r) => r !== id) : [...prev.restaurants, id],
        };
      });
      // Toast added via side effect check below to avoid stale reads.
      return !favorites.restaurants.includes(id);
    },
    [favorites, setFavorites]
  );

  const toggleFood = useCallback(
    (id) => {
      setFavorites((prev) => {
        const has = prev.foods.includes(id);
        return {
          ...prev,
          foods: has ? prev.foods.filter((f) => f !== id) : [...prev.foods, id],
        };
      });
      return !favorites.foods.includes(id);
    },
    [favorites, setFavorites]
  );

  const toggleRestaurantWithToast = useCallback(
    (id, name) => {
      const added = toggleRestaurant(id);
      toast(added ? `${name} added to favourites ❤️` : `${name} removed from favourites`, added ? 'success' : 'info');
    },
    [toggleRestaurant, toast]
  );

  const toggleFoodWithToast = useCallback(
    (id, name) => {
      const added = toggleFood(id);
      toast(added ? `${name} added to favourites ❤️` : `${name} removed from favourites`, added ? 'success' : 'info');
    },
    [toggleFood, toast]
  );

  const value = useMemo(
    () => ({
      favoriteRestaurants: favorites.restaurants,
      favoriteFoods: favorites.foods,
      isRestaurantFav: (id) => favorites.restaurants.includes(id),
      isFoodFav: (id) => favorites.foods.includes(id),
      toggleRestaurant: toggleRestaurantWithToast,
      toggleFood: toggleFoodWithToast,
    }),
    [favorites, toggleRestaurantWithToast, toggleFoodWithToast]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

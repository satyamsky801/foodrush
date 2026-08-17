import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/constants';
import { itemTotal } from '../utils/pricing';
import { useToast } from './ToastContext';
import Modal from '../components/Modal';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

const EMPTY_CART = {
  restaurantId: null, // Mongo _id — used when placing the order
  restaurantSlug: null, // slug — used for /restaurant/:slug links
  restaurantName: null,
  restaurantImage: null,
  items: [],
};

/**
 * Builds a stable line key so two identical configurations of the same dish
 * merge into one cart line, while different customizations stay separate.
 */
const lineKey = (item) =>
  [
    item.id,
    item.customizations?.map((c) => `${c.id}:${c.optionId}`).join('|') || '',
    item.addons?.map((a) => a.id).join('|') || '',
  ].join('__');

/** Turn an API food (already normalized) into a cart line entry. */
const toEntry = (item, quantity, addons, customizations) => {
  const addonTotal = addons.reduce((s, a) => s + (a.price || 0), 0);
  const customTotal = customizations.reduce((s, c) => s + (c.price || 0), 0);
  return {
    key: lineKey({ id: item.id, addons, customizations }),
    id: item.id, // food Mongo _id (order payload foodId)
    name: item.name,
    image: item.image,
    veg: item.veg,
    category: item.category,
    unitPrice: item.price,
    addons,
    addonTotal,
    customTotal,
    customizations: customizations.map((c) => ({
      id: c.id,
      name: c.name,
      optionId: c.optionId,
      optionName: c.optionName,
      price: c.price || 0,
    })),
    quantity,
  };
};

export function CartProvider({ children }) {
  const [cart, setCart] = useLocalStorage(STORAGE_KEYS.cart, EMPTY_CART);
  const [conflict, setConflict] = useState(null); // { pending, currentRestaurant }
  const toast = useToast();

  const addItem = useCallback(
    (item, { quantity = 1, addons = [], customizations = [] } = {}) => {
      const hasExisting = (cart.items || []).length > 0;

      // Single-restaurant cart: if items are already from another restaurant,
      // ask the user whether to switch.
      if (hasExisting && cart.restaurantId !== item.restaurantMongoId) {
        setConflict({ pending: { item, quantity, addons, customizations }, currentRestaurant: cart.restaurantName });
        return;
      }

      const entry = toEntry(item, quantity, addons, customizations);

      setCart((prev) => {
        const base = prev.items?.length ? prev : EMPTY_CART;
        const existing = base.items.find((it) => it.key === entry.key);
        const items = existing
          ? base.items.map((it) => (it.key === entry.key ? { ...it, quantity: it.quantity + quantity } : it))
          : [...base.items, entry];
        return {
          restaurantId: item.restaurantMongoId,
          restaurantSlug: item.restaurantId,
          restaurantName: item.restaurantName,
          restaurantImage: item.restaurantImage,
          items,
        };
      });
      toast(`${item.name} added to cart 🛒`);
    },
    [cart, setCart, toast]
  );

  const replaceAndAdd = useCallback(() => {
    if (!conflict) return;
    const { pending } = conflict;
    const entry = toEntry(pending.item, pending.quantity, pending.addons, pending.customizations);
    setCart({
      restaurantId: pending.item.restaurantMongoId,
      restaurantSlug: pending.item.restaurantId,
      restaurantName: pending.item.restaurantName,
      restaurantImage: pending.item.restaurantImage,
      items: [entry],
    });
    setConflict(null);
    toast(`Cart cleared — ${pending.item.name} added instead 🛒`);
  }, [conflict, setCart, toast]);

  const cancelConflict = useCallback(() => setConflict(null), []);

  const updateQuantity = useCallback(
    (key, quantity) => {
      if (quantity <= 0) {
        setCart((prev) => ({ ...prev, items: prev.items.filter((it) => it.key !== key) }));
        return;
      }
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.key === key ? { ...it, quantity } : it)),
      }));
    },
    [setCart]
  );

  const removeItem = useCallback(
    (key) => {
      setCart((prev) => {
        const items = prev.items.filter((it) => it.key !== key);
        return items.length ? { ...prev, items } : EMPTY_CART;
      });
      toast('Item removed from cart', 'info');
    },
    [setCart, toast]
  );

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
  }, [setCart]);

  const replaceCart = useCallback((restaurantId, restaurantName, items, restaurantSlug) => {
    setCart({
      restaurantId,
      restaurantSlug: restaurantSlug || items[0]?.restaurantSlug || null,
      restaurantName,
      restaurantImage: items[0]?.restaurantImage || null,
      items,
    });
  }, [setCart]);

  const count = useMemo(
    () => (cart.items || []).reduce((s, it) => s + it.quantity, 0),
    [cart]
  );

  const total = useMemo(() => itemTotal(cart), [cart]);

  const value = useMemo(
    () => ({
      cart,
      count,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      replaceCart,
    }),
    [cart, count, total, addItem, updateQuantity, removeItem, clearCart, replaceCart]
  );

  return (
    <CartContext.Provider value={value}>
      {children}

      {/* Conflict modal: switching restaurants */}
      <Modal
        open={Boolean(conflict)}
        onClose={cancelConflict}
        title="Items from another restaurant"
        icon="🍽️"
      >
        {conflict && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Your cart already has items from <strong>{conflict.currentRestaurant}</strong>. FoodRush
              delivers from one restaurant per order. Replace them with the new item?
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={replaceAndAdd} className="btn-primary flex-1">
                Yes, replace cart
              </button>
              <button onClick={cancelConflict} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </CartContext.Provider>
  );
}

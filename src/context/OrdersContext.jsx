import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { orderApi } from '../api/orderApi';
import { foodApi } from '../api/foodApi';
import { mapOrder, mapFood } from '../api/normalizers';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useToast } from './ToastContext';

const OrdersContext = createContext(null);

export const useOrders = () => useContext(OrdersContext);

/**
 * Orders live in MongoDB — this context caches the current user's orders and
 * keeps them in sync with the backend after placing/reordering.
 */
export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { replaceCart } = useCart();
  const toast = useToast();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const { orders: list } = await orderApi.getMyOrders();
      setOrders(list.map(mapOrder));
    } catch {
      // Silent — pages render their own states.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh, user?.id]);

  /** POST /api/orders — the backend computes the authoritative total. */
  const placeOrder = useCallback(async (payload) => {
    const { order } = await orderApi.placeOrder(payload);
    const mapped = mapOrder(order);
    setOrders((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const getOrder = useCallback((id) => orders.find((o) => o._id === id) || null, [orders]);

  /**
   * POST /api/orders/:id/reorder — the backend returns the food ids; we refetch
   * each dish so the cart gets fresh, authoritative prices.
   */
  const reorder = useCallback(
    async (orderId) => {
      try {
        const { restaurantId, items: srcItems } = await orderApi.reorder(orderId);

        const cartItems = [];
        for (const src of srcItems) {
          const { food } = await foodApi.getById(src.foodId);
          const mapped = mapFood(food, food.restaurant);

          // Rebuild add-ons / customizations from the food's current menu.
          const addons = (food.addons || []).filter((a) =>
            (src.addons || []).some((x) => String(x.id) === String(a.id))
          );
          const customizations = (src.customizations || [])
            .map((c) => {
              const group = (food.customizations || []).find((g) => String(g.id) === String(c.id));
              const opt = group?.options.find((o) => String(o.id) === String(c.optionId));
              return opt
                ? { id: group.id, name: group.name, optionId: opt.id, optionName: opt.name, price: opt.price }
                : null;
            })
            .filter(Boolean);

          cartItems.push({
            key: [mapped.id, addons.map((a) => a.id).join('|'), customizations.map((c) => `${c.id}:${c.optionId}`).join('|')].join('__'),
            id: mapped.id,
            name: mapped.name,
            image: mapped.image,
            veg: mapped.veg,
            category: mapped.category,
            unitPrice: mapped.price,
            addons,
            addonTotal: addons.reduce((s, a) => s + (a.price || 0), 0),
            customizations,
            customTotal: customizations.reduce((s, c) => s + (c.price || 0), 0),
            quantity: src.quantity || 1,
            restaurantId: mapped.restaurantMongoId,
            restaurantSlug: mapped.restaurantId,
            restaurantName: mapped.restaurantName,
            restaurantImage: mapped.restaurantImage,
          });
        }

        replaceCart(
          restaurantId,
          cartItems[0]?.restaurantName || 'Restaurant',
          cartItems,
          cartItems[0]?.restaurantSlug
        );
        toast('Items added back to your cart 🛒');
        return { ok: true };
      } catch (e) {
        toast(e.message, 'error');
        return { error: e.message };
      }
    },
    [replaceCart, toast]
  );

  const value = useMemo(
    () => ({ orders, loading, placeOrder, getOrder, reorder, refresh }),
    [orders, loading, placeOrder, getOrder, reorder, refresh]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

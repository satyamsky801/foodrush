import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, STAGE_DURATION_MS, ORDER_STATUSES } from '../data/constants';
import { getRestaurant } from '../data/restaurants';
import { uid } from '../utils/format';
import { useToast } from './ToastContext';
import { useCart } from './CartContext';

const OrdersContext = createContext(null);

export const useOrders = () => useContext(OrdersContext);

// Demo delivery partners cycled across orders.
const PARTNERS = [
  { name: 'Rahul Kumar', phone: '+91 98450 12345', rating: 4.8, vehicle: 'KA 01 AB 2345' },
  { name: 'Imran Shaikh', phone: '+91 99860 54321', rating: 4.7, vehicle: 'KA 03 CD 8765' },
  { name: 'Suresh Patil', phone: '+91 90080 98765', rating: 4.9, vehicle: 'KA 05 EF 1122' },
];

/** Live status derived from elapsed time so tracking animates in real time. */
export const statusForOrder = (order) => {
  if (!order) return ORDER_STATUSES[0].id;
  const elapsed = Date.now() - order.placedAt;
  const index = Math.min(ORDER_STATUSES.length - 1, Math.floor(elapsed / STAGE_DURATION_MS));
  return ORDER_STATUSES[index].id;
};

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useLocalStorage(STORAGE_KEYS.orders, []);
  const toast = useToast();
  const { replaceCart } = useCart();

  const placeOrder = useCallback(
    ({ restaurant, items, address, paymentMethod, coupon, breakdown }) => {
      const order = {
        id: uid('FR'),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image,
        items: items.map((it) => ({
          key: it.key,
          id: it.id,
          name: it.name,
          image: it.image,
          veg: it.veg,
          unitPrice: it.unitPrice,
          addons: it.addons,
          addonTotal: it.addonTotal,
          customTotal: it.customTotal,
          customizations: it.customizations,
          quantity: it.quantity,
        })),
        address: { ...address },
        paymentMethod,
        couponCode: coupon ? coupon.code : null,
        breakdown: {
          total: breakdown.total,
          deliveryFee: breakdown.deliveryFee,
          tax: breakdown.tax,
          discount: breakdown.discount,
          grandTotal: breakdown.grandTotal,
        },
        deliveryPartner: PARTNERS[orders.length % PARTNERS.length],
        placedAt: Date.now(),
        estimatedDelivery: restaurant.deliveryTime,
      };
      setOrders((prev) => [order, ...prev]);
      return order;
    },
    [orders.length, setOrders]
  );

  const getOrder = useCallback((id) => orders.find((o) => o.id === id), [orders]);

  const reorder = useCallback(
    (orderId) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const restaurant = getRestaurant(order.restaurantId);
      if (!restaurant) return;
      replaceCart(
        order.restaurantId,
        order.restaurantName,
        order.items.map((it) => ({ ...it, quantity: it.quantity }))
      );
      toast('Items added back to your cart 🛒');
    },
    [orders, replaceCart, toast]
  );

  const value = useMemo(
    () => ({ orders, placeOrder, getOrder, reorder }),
    [orders, placeOrder, getOrder, reorder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

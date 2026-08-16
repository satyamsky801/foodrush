export const APP_NAME = 'FoodRush';

export const TAX_RATE = 0.05; // 5% GST on the item total

export const STORAGE_KEYS = {
  cart: 'foodrush_cart',
  favorites: 'foodrush_favorites',
  user: 'foodrush_user',
  users: 'foodrush_users',
  orders: 'foodrush_orders',
  addresses: 'foodrush_addresses',
  settings: 'foodrush_settings',
  paymentMethods: 'foodrush_payment_methods',
};

export const ORDER_STATUSES = [
  { id: 'placed', label: 'Order placed' },
  { id: 'accepted', label: 'Restaurant accepted' },
  { id: 'preparing', label: 'Food being prepared' },
  { id: 'picked-up', label: 'Picked up' },
  { id: 'out-for-delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
];

// Demo-only: each tracking stage advances every N ms so the timeline feels live.
export const STAGE_DURATION_MS = 15000;

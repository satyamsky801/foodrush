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

// Matches the backend Order model's status flow.
export const ORDER_STATUSES = [
  { id: 'placed', label: 'Order placed' },
  { id: 'accepted', label: 'Restaurant accepted' },
  { id: 'preparing', label: 'Food being prepared' },
  { id: 'ready', label: 'Ready for pickup' },
  { id: 'picked-up', label: 'Picked up' },
  { id: 'out-for-delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
];

// Unique cuisine names across the seeded restaurants (filter UI options).
export const CUISINES = [
  'American', 'Asian', 'Bakery', 'Biryani', 'Burgers', 'Chaat', 'Chinese', 'Desserts',
  'Filter Coffee', 'Healthy', 'Hyderabadi', 'Italian', 'Mughlai', 'North Indian', 'Pizza',
  'Rolls', 'Salads', 'South Indian', 'Street Food',
].sort();

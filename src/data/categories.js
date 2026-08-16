// Food categories shown on the home page & used for filtering.
// The `emoji` doubles as the image fallback so the app works offline too.
export const categories = [
  { id: 'pizza', name: 'Pizza', emoji: '🍕', tagline: 'Cheesy goodness' },
  { id: 'burger', name: 'Burger', emoji: '🍔', tagline: 'Juicy & stacked' },
  { id: 'biryani', name: 'Biryani', emoji: '🍛', tagline: 'Fragrant & rich' },
  { id: 'chinese', name: 'Chinese', emoji: '🥡', tagline: 'Wok-tossed' },
  { id: 'south-indian', name: 'South Indian', emoji: '🥞', tagline: 'Crispy dosas' },
  { id: 'north-indian', name: 'North Indian', emoji: '🍲', tagline: 'Curries & kebabs' },
  { id: 'rolls', name: 'Rolls', emoji: '🌯', tagline: 'Loaded wraps' },
  { id: 'desserts', name: 'Desserts', emoji: '🍨', tagline: 'Sweet endings' },
  { id: 'cakes', name: 'Cakes', emoji: '🎂', tagline: 'Celebrate' },
  { id: 'fast-food', name: 'Fast Food', emoji: '🍟', tagline: 'Quick bites' },
  { id: 'healthy', name: 'Healthy Food', emoji: '🥗', tagline: 'Fresh & light' },
  { id: 'beverages', name: 'Beverages', emoji: '🥤', tagline: 'Sips & shakes' },
];

export const getCategory = (id) => categories.find((c) => c.id === id);

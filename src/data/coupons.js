/**
 * Sample coupons.
 * type: 'percent' | 'freedelivery'
 */
export const coupons = [
  {
    code: 'WELCOME50',
    type: 'percent',
    value: 50, // 50% off
    maxDiscount: 100, // up to ₹100
    minOrder: 199,
    title: '50% OFF up to ₹100',
    description: 'Welcome deal on your first order. Minimum order ₹199.',
  },
  {
    code: 'FOOD20',
    type: 'percent',
    value: 20, // 20% off
    maxDiscount: 150, // up to ₹150
    minOrder: 299,
    title: '20% OFF up to ₹150',
    description: 'Flat 20% off on orders above ₹299.',
  },
  {
    code: 'FREEDEL',
    type: 'freedelivery',
    value: 0,
    maxDiscount: 0,
    minOrder: 0,
    title: 'FREE Delivery',
    description: 'No delivery fee on your order. No minimum order.',
  },
];

export const getCoupon = (code) =>
  coupons.find((c) => c.code.toUpperCase() === String(code || '').trim().toUpperCase());

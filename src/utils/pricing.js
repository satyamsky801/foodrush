import { TAX_RATE } from '../data/constants';
import { getCoupon } from '../data/coupons';

/** Item total = sum of (unit price incl. add-ons) × quantity. */
export const itemTotal = (cart) =>
  (cart?.items || []).reduce(
    (sum, it) => sum + (it.unitPrice + (it.addonTotal || 0) + (it.customTotal || 0)) * it.quantity,
    0
  );

/** Delivery fee, free above the restaurant threshold. */
export const deliveryFeeFor = (cart, restaurant) => {
  if (!cart || !cart.items?.length) return 0;
  if (!restaurant) return 0;
  const total = itemTotal(cart);
  if (restaurant.freeDeliveryAbove && total >= restaurant.freeDeliveryAbove) return 0;
  return restaurant.deliveryFee || 0;
};

export const taxFor = (cart) => Math.round(itemTotal(cart) * TAX_RATE);

/**
 * Apply a coupon.
 * Returns { discount, error? } where discount is in ₹.
 * WELCOME50 → 50% off up to ₹100 · FOOD20 → 20% off up to ₹150 · FREEDEL → free delivery.
 */
export const couponDiscount = (coupon, total, deliveryFee) => {
  if (!coupon) return { discount: 0 };
  if (coupon.minOrder && total < coupon.minOrder) {
    return {
      discount: 0,
      error: `Add items worth ₹${coupon.minOrder - total} more to use ${coupon.code}`,
    };
  }
  if (coupon.type === 'percent') {
    const raw = (total * coupon.value) / 100;
    return { discount: Math.min(raw, coupon.maxDiscount) };
  }
  if (coupon.type === 'freedelivery') {
    return { discount: deliveryFee };
  }
  return { discount: 0 };
};

/** Full breakdown used by the cart, checkout and order pages. */
export const priceBreakdown = (cart, restaurant, couponCode) => {
  const total = itemTotal(cart);
  const deliveryFee = deliveryFeeFor(cart, restaurant);
  const tax = taxFor(cart);
  const coupon = couponCode ? getCoupon(couponCode) : null;
  const { discount, error } = couponDiscount(coupon, total, deliveryFee);
  const grandTotal = Math.max(0, total + deliveryFee + tax - discount);
  return { total, deliveryFee, tax, coupon, discount, error, grandTotal };
};

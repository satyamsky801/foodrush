import Coupon from '../models/Coupon.js';

export const TAX_RATE = 0.05; // 5% GST — must match the frontend

/** Item subtotal = Σ (unitPrice + addons + customizations) × quantity. */
export const computeItemTotal = (items) =>
  items.reduce((sum, it) => sum + (it.unitPrice + (it.addonTotal || 0) + (it.customTotal || 0)) * it.quantity, 0);

export const computeDeliveryFee = (itemTotal, restaurant) => {
  if (!restaurant) return 0;
  if (restaurant.freeDeliveryAbove && itemTotal >= restaurant.freeDeliveryAbove) return 0;
  return restaurant.deliveryFee || 0;
};

export const computeTax = (itemTotal) => Math.round(itemTotal * TAX_RATE);

/**
 * Validate + compute a coupon discount server-side.
 * Returns { discount, coupon } or throws for an invalid coupon.
 */
export async function computeCouponDiscount(code, itemTotal, deliveryFee) {
  if (!code) return { discount: 0, coupon: null };

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    const err = new Error(`Coupon ${code} is invalid or inactive.`);
    err.statusCode = 400;
    throw err;
  }
  if (coupon.minOrder && itemTotal < coupon.minOrder) {
    const err = new Error(`Add items worth ₹${coupon.minOrder - itemTotal} more to use ${coupon.code}.`);
    err.statusCode = 400;
    throw err;
  }
  if (coupon.type === 'percent') {
    return { discount: Math.min((itemTotal * coupon.value) / 100, coupon.maxDiscount), coupon };
  }
  if (coupon.type === 'freedelivery') {
    return { discount: deliveryFee, coupon };
  }
  return { discount: 0, coupon };
}

export const computeBreakdown = ({ total, deliveryFee, tax, discount }) => ({
  total,
  deliveryFee,
  tax,
  discount,
  grandTotal: Math.max(0, total + deliveryFee + tax - discount),
});

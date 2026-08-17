/**
 * Shape the backend's Mongoose documents into the objects the existing
 * frontend components expect (id, restaurantId, restaurantName, …).
 *
 * Backend ids: restaurants have a stable `slug`; foods/orders/addresses use
 * Mongo `_id`. The UI keeps using `id`/`restaurantId` (slugs) for URLs and
 * favourites, and keeps the Mongo `_id` alongside for order payloads.
 */

export const mapRestaurant = (r) => ({
  ...r,
  id: r.slug, // UI + URL + favourites key (stable across reseeds)
  slug: r.slug,
});

/**
 * @param {object} f  Food doc from the API (may carry a populated `restaurant`)
 * @param {object} [ctx]  Restaurant context when `f.restaurant` is a bare ObjectId
 */
export const mapFood = (f, ctx) => {
  const r = ctx || f.restaurant;
  return {
    ...f,
    id: f._id, // Mongo id — used as the cart line key + order foodId
    restaurantId: r?.slug || f.restaurantSlug || null, // slug for URLs
    restaurantMongoId: r?._id || null, // Mongo id for POST /orders
    restaurantName: r?.name || f.restaurantName || '',
    restaurantImage: r?.image || f.restaurantImage || '',
    restaurantDeliveryFee: r?.deliveryFee,
    restaurantDeliveryTime: r?.deliveryTime,
  };
};

export const mapAddress = (a) => ({
  ...a,
  id: a._id,
});

/** Orders: display `orderId` (FRxxxxx) as `id`, keep `_id` for URLs/tracking. */
export const mapOrder = (o) => ({
  ...o,
  id: o.orderId || o._id,
  _id: o._id,
  placedAt: new Date(o.createdAt || Date.now()).getTime(),
  restaurantId: o.restaurant?._id || o.restaurant || null,
  restaurantSlug: o.restaurant?.slug || '',
  restaurantName: o.restaurant?.name || o.restaurantName || 'Restaurant',
  restaurantImage: o.restaurant?.image || o.restaurantImage || '',
  orderStatus: o.orderStatus || 'placed',
  items: (o.items || []).map((it, i) => ({
    ...it,
    id: it.food || it.id || `item-${i}`,
    key: it.key || `${it.food || `item-${i}`}-${i}`,
  })),
});

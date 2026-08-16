/** Generates a human-friendly order id like FR3XK9QZ. */
export const generateOrderId = () =>
  'FR' + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).toUpperCase().slice(2, 6);

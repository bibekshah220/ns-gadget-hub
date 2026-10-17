/* Shared by the client and /api/cart/update so the UI can refuse an over-long
   cart with a useful message instead of discovering the server's 400. */
export const MAX_CART_LINES = 100;
export const MAX_QUANTITY_PER_ITEM = 100;

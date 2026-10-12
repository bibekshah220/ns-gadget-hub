/**
 * Seller check against the live DB role.
 *
 * Takes the user document that requireAuth already loaded, so the caller
 * pays for exactly one lookup per request.
 */
const authSeller = (user) =>
  Boolean(user) && (user.role === "seller" || user.role === "admin");

export default authSeller;

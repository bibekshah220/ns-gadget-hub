/* Single source for the deployed origin. The fallback is the live domain, so
   a missing env var can never leak localhost into canonicals or JSON-LD. */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ns-gadget-hub.vercel.app";

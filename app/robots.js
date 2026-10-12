const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /* Account and checkout pages carry no public content and must not be
           crawled or indexed. */
        disallow: [
          "/api/",
          "/cart",
          "/my-orders",
          "/add-address",
          "/order-placed",
          "/seller",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/payment/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

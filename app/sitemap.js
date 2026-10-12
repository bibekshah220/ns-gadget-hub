import connectToDatabase from "@/config/db";
import Product from "@/models/product";

import { SITE_URL as siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap() {
  const staticRoutes = [
    { url: "/", changeFrequency: "daily", priority: 1 },
    { url: "/all-products", changeFrequency: "daily", priority: 0.9 },
    { url: "/about", changeFrequency: "monthly", priority: 0.5 },
    { url: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { url: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  ].map((route) => ({
    ...route,
    url: `${siteUrl}${route.url}`,
    lastModified: new Date(),
  }));

  try {
    await connectToDatabase();

    const products = await Product.find({}, "updatedAt")
      .sort({ date: -1 })
      .limit(5000)
      .lean();

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${siteUrl}/product/${product._id}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      })),
    ];
  } catch (error) {
    /* A database blip must not take the whole sitemap down. */
    console.error("Sitemap product lookup failed:", error);
    return staticRoutes;
  }
}

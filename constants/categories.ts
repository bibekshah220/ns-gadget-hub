/* Shop-by-category entries. `slug` is what the URL carries, `value` is the
   enum stored on Product.category, so the two can diverge safely. */
export type ShopCategory = {
  slug: string;
  label: string;
  value: string;
};

export const SHOP_CATEGORIES: ShopCategory[] = [
  { slug: "smartphones", label: "Smartphones", value: "Smartphone" },
  { slug: "laptops", label: "Laptops", value: "Laptop" },
  { slug: "headphones", label: "Headphones", value: "Headphone" },
  { slug: "smartwatches", label: "Smartwatches", value: "Watch" },
  { slug: "cameras", label: "Cameras", value: "Camera" },
];

export const categoryBySlug = (slug?: string | null): ShopCategory | undefined =>
  SHOP_CATEGORIES.find((category) => category.slug === slug);

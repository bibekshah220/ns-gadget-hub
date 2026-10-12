import connectToDatabase from "@/config/db";
import Product from "@/models/product";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const loadProduct = async (id) => {
  try {
    await connectToDatabase();
    return await Product.findById(id).lean();
  } catch {
    return null;
  }
};

/* Real per-product tags: a shared title across every product page is one of
   the quickest ways to lose product search traffic. */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }

  const description = product.description?.slice(0, 160) || `Buy ${product.name} in Nepal.`;
  const url = `${siteUrl}/product/${id}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${id}` },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description,
      images: product.image?.length ? [{ url: product.image[0], alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.image?.slice(0, 1),
    },
  };
}

export default async function ProductLayout({ children, params }) {
  const { id } = await params;
  const product = await loadProduct(id);

  /* Product schema drives rich results: price, availability and currency. */
  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    category: product.category,
    sku: String(product._id),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${id}`,
      priceCurrency: "NPR",
      price: product.offerPrice,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "N.S Gadget Hub" },
    },
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

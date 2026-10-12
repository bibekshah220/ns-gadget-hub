"use client";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";

/* Same footprint as a real card, so the grid does not jump when the catalog
   arrives. The list is client-fetched, so the server HTML ships these. */
const ProductSkeleton = () => (
  <div className="flex flex-col h-full bg-white border border-gray-200/80 rounded-2xl p-5" aria-hidden="true">
    <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
    <div className="mt-5 space-y-2">
      <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
      <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
    </div>
    <div className="mt-6 h-4 w-24 rounded bg-gray-100 animate-pulse" />
  </div>
);

const HomeProducts = () => {

  const { products, productsLoading } = useAppContext()

  return (
    <div className="flex flex-col items-center pt-14">
      <h2 className="text-2xl font-medium text-left w-full">Popular products</h2>
      <div
        aria-busy={productsLoading}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full"
      >
        {productsLoading
          ? Array.from({ length: 10 }, (_, index) => <ProductSkeleton key={index} />)
          : products.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
      <Link
        href="/all-products"
        className="inline-flex items-center min-h-11 px-12 py-2.5 border rounded text-gray-600 hover:bg-slate-50/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
      >
        See more
      </Link>
    </div>
  );
};

export default HomeProducts;

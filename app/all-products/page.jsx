'use client'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { categoryBySlug } from "@/constants/categories";

const ProductGrid = () => {

    const { products, fetchProductData } = useAppContext();
    const searchParams = useSearchParams();

    const category = categoryBySlug(searchParams.get("category"));
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    /* The provider loads products once on mount, so a tab opened before a
       product was published would show a stale list forever. Refetch on visit. */
    useEffect(() => {
        fetchProductData();
    }, []);

    const visible = products.filter((product) => {
        if (category && product.category !== category.value) return false;
        if (search && !product.name.toLowerCase().includes(search)) return false;
        return true;
    });

    const heading = category ? category.label : search ? `Results for "${search}"` : "All products";
    const filtered = Boolean(category || search);

    return (
        <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
            <div className="flex flex-col items-end pt-12">
                <h1 className="text-2xl font-medium">{heading}</h1>
                <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
            </div>

            {filtered && (
                <p className="mt-4 text-sm text-gray-500">
                    {visible.length} {visible.length === 1 ? "product" : "products"}
                    {" · "}
                    <Link href="/all-products" className="text-orange-700 hover:underline">
                        Clear filter
                    </Link>
                </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
                {visible.map((product) => <ProductCard key={product._id} product={product} />)}
            </div>

            {filtered && visible.length === 0 && (
                <p className="pb-14 text-gray-500">
                    Nothing here yet.{" "}
                    <Link href="/all-products" className="text-orange-700 hover:underline">
                        Browse everything
                    </Link>
                    .
                </p>
            )}
        </div>
    );
};

const AllProducts = () => (
    <>
        <Navbar />
        {/* useSearchParams needs a boundary so the shell can still prerender. */}
        <Suspense fallback={<div className="min-h-[60vh]" />}>
            <ProductGrid />
        </Suspense>
        <Footer />
    </>
);

export default AllProducts;

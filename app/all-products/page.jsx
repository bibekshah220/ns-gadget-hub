'use client'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { useEffect } from "react";

const AllProducts = () => {

    const { products, fetchProductData } = useAppContext();

    /* The provider loads products once on mount, so a tab opened before a
       product was published would show a stale list forever. Refetch on visit. */
    useEffect(() => {
        fetchProductData();
    }, []);

    return (
        <>
            <Navbar />
            <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
                <div className="flex flex-col items-end pt-12">
                    <h1 className="text-2xl font-medium">All products</h1>
                    <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
                    {products.map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AllProducts;

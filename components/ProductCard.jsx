"use client";
import Image from "next/image";
import Link from "next/link";
import Stars from "@/components/Stars";
import { formatNpr } from "@/lib/money";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/* The eyebrow is derived from the record, never decorative: a real saving or
   a genuinely recent listing, otherwise nothing. */
const eyebrowFor = (product) => {
  const saving = product.price - product.offerPrice;

  if (saving > 0) {
    return `Save ${formatNpr(saving)}`;
  }

  if (product.date && Date.now() - product.date < THIRTY_DAYS) {
    return "New";
  }

  return null;
};

const ProductCard = ({ product }) => {
  const eyebrow = eyebrowFor(product);
  const outOfStock = product.stock === 0;

  return (
    <Link
      href={`/product/${product._id}`}
      className="group flex flex-col h-full bg-white border border-gray-200/80 rounded-2xl p-5 transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-center aspect-square bg-white rounded-xl overflow-hidden">
        <Image
          src={product.image[0]}
          alt={product.name}
          width={600}
          height={600}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="mt-5 flex flex-col flex-1">
        {eyebrow && (
          <p className="text-xs font-medium text-orange-700 mb-1.5">{eyebrow}</p>
        )}

        <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.ratingCount > 0 && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
            <Stars value={product.ratingAvg} size={12} />
            {product.ratingAvg} ({product.ratingCount})
          </p>
        )}

        <p className="mt-auto pt-4 text-sm md:text-base text-gray-900">
          {formatNpr(product.offerPrice)}
          {/* Struck-through price only where the record carries a higher list
              price; nothing here invents a discount. */}
          {product.price > product.offerPrice && (
            <span className="ml-2 text-gray-400 line-through">
              {formatNpr(product.price)}
            </span>
          )}
        </p>

        {outOfStock && (
          <p className="text-xs text-gray-500 mt-1">Out of stock</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;

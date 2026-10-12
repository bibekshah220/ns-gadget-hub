import Link from "next/link";
import { SHOP_CATEGORIES } from "@/constants/categories";

/* One glyph per category, inline so the strip costs no extra requests. */
const icons = {
  smartphones: <rect x="7" y="2" width="10" height="20" rx="2" />,
  laptops: <path d="M4 5h16v11H4zM2 19h20" />,
  headphones: <path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zm13 0h3v5h-3z" />,
  smartwatches: <path d="M9 2h6v3H9zm0 17h6v3H9z M6 7h12v10H6z" />,
  cameras: <path d="M3 7h4l2-2h6l2 2h4v12H3zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />,
};

const CategoryStrip = () => (
  <section aria-labelledby="shop-by-category" className="pt-10">
    <h2 id="shop-by-category" className="text-2xl font-medium">
      Shop by category
    </h2>

    {/* Scrolls sideways on a phone, settles into a five-up grid from sm. */}
    <ul className="mt-6 flex gap-4 overflow-x-auto snap-x pb-2 sm:grid sm:grid-cols-5 sm:overflow-visible">
      {SHOP_CATEGORIES.map(({ slug, label }) => (
        <li key={slug} className="snap-start shrink-0 w-36 sm:w-auto">
          <Link
            href={`/all-products?category=${slug}`}
            className="flex flex-col items-center gap-2 h-full px-4 py-5 rounded-xl border border-gray-200 hover:border-orange-700 hover:text-gray-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
          >
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-orange-700"
            >
              {icons[slug]}
            </svg>
            <span className="text-sm font-medium">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

export default CategoryStrip;

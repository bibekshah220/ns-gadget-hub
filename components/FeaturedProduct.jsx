import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";

const products = [
  {
    id: 1,
    image: "/images/feature-headphones.jpg",
    alt: "Over-ear headphones on a desk",
    title: "Unparalleled Sound",
    description: "Experience crystal-clear audio with premium headphones.",
    cta: "Shop headphones",
    href: "/all-products?category=headphones",
  },
  {
    id: 2,
    image: "/images/feature-earbuds.jpg",
    alt: "Wireless earbuds in their charging case",
    title: "Stay Connected",
    description: "Compact and stylish earphones for every occasion.",
    cta: "Shop earbuds",
    href: "/all-products?search=earbuds",
  },
  {
    id: 3,
    image: "/images/feature-laptop.jpg",
    alt: "Open laptop on a work desk",
    title: "Power in Every Pixel",
    description: "Shop the latest laptops for work, gaming, and more.",
    cta: "Shop laptops",
    href: "/all-products?category=laptops",
  },
];

const FeaturedProduct = () => {
  return (
    <div className="mt-14">
      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-medium">Featured Products</h2>
        <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 mt-12 md:px-14 px-4">
        {products.map(({ id, image, alt, title, description, cta, href }) => (
          <div key={id} className="relative group">
            <Image
              src={image}
              alt={alt}
              width={700}
              height={500}
              className="group-hover:brightness-75 transition duration-300 w-full h-64 object-cover rounded-lg"
            />
            {/* Photos are brighter than the old cut-outs, so the caption needs a scrim to stay legible. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent rounded-lg pointer-events-none" />
            <div className="group-hover:-translate-y-4 transition duration-300 absolute bottom-8 left-8 text-white space-y-2">
              <p className="font-medium text-xl lg:text-2xl">{title}</p>
              <p className="text-sm lg:text-base leading-5 max-w-60">
                {description}
              </p>
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 min-h-11 bg-orange-700 px-4 py-2 rounded hover:bg-orange-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                {cta} <Image className="h-3 w-3" src={assets.redirect_icon} alt="" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProduct;

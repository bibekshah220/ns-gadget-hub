import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";

const Banner = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between md:pl-20 py-14 md:py-0 bg-[#E6E9F2] my-16 rounded-xl overflow-hidden">
      <Image
        className="max-w-56 rounded-lg"
        src="/images/banner-speaker.jpg"
        alt="Edifier bookshelf speaker"
        width={600}
        height={600}
      />
      <div className="flex flex-col items-center justify-center text-center space-y-2 px-4 md:px-0">
        <h2 className="text-2xl md:text-3xl font-semibold max-w-[290px]">
          Level Up Your Gaming Experience
        </h2>
        <p className="max-w-[343px] font-medium text-gray-800/60">
          From immersive sound to precise controls—everything you need to win
        </p>
        <Link
          href="/all-products?search=controller"
          className="group inline-flex items-center justify-center gap-1 min-h-11 px-12 py-2.5 bg-orange-700 rounded text-white hover:bg-orange-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
        >
          Shop gaming gear
          <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon_white} alt="" />
        </Link>
      </div>
      {/* One controller image for every breakpoint; it used to be rendered
          twice, with the mobile copy only differing by width. */}
      <Image
        className="max-w-56 md:max-w-80 rounded-lg"
        src="/images/banner-controller.jpg"
        alt="PlayStation wireless game controller"
        width={700}
        height={700}
      />
    </div>
  );
};

export default Banner;

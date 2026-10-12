import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import CategoryStrip from "@/components/CategoryStrip";
import TrustRow from "@/components/TrustRow";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Testimonials from "@/components/Testimonials";
import Faq from "@/components/Faq";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "N.S Gadget Hub — Buy Gadgets Online in Nepal",
  description:
    "Shop genuine smartphones, laptops, headphones, smartwatches and cameras in Nepal. Cash on delivery, Khalti, eSewa and card payments, with delivery across the country.",
  alternates: { canonical: "/" },
};

const Home = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32">
        {/* The slider carries the visible headings, so the page's single h1
            lives here for search engines and screen readers. */}
        <h1 className="sr-only">
          N.S Gadget Hub — buy genuine gadgets online in Nepal
        </h1>
        <HeaderSlider />
        <TrustRow />
        <CategoryStrip />
        <HomeProducts />
        <FeaturedProduct />
        <Banner />
        <Testimonials />
        <Faq />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;

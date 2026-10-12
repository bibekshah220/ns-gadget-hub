import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About Us",
  description:
    "N.S Gadget Hub is a Nepal-based online store for headphones, phones, laptops, cameras and accessories, with cash on delivery, Khalti, eSewa and card payments.",
  alternates: { canonical: "/about" },
};

const CATEGORIES = [
  "Smartphones",
  "Laptops & tablets",
  "Headphones",
  "Earphones",
  "Smartwatches",
  "Cameras",
  "Accessories",
];

const PROMISES = [
  {
    title: "Genuine products",
    body: "Every item is sourced from authorised distributors and checked before it is listed. What you see on the product page is what arrives.",
  },
  {
    title: "Prices in rupees, tax included",
    body: "Listings are in NPR with the offer price shown up front. The 13% VAT is calculated at checkout, so the total you confirm is the total you pay.",
  },
  {
    title: "Pay the way you prefer",
    body: "Cash on delivery if you would rather see the product first, or Khalti, eSewa and card if you would rather settle it now.",
  },
  {
    title: "Delivery across Nepal",
    body: "Orders inside the Kathmandu valley usually arrive within two working days. Outside the valley takes three to five, depending on the route.",
  },
];

const AboutUs = () => (
  <>
    <Navbar />

    <main className="px-6 md:px-16 lg:px-32">
      <section className="pt-12 md:pt-16">
        <div className="flex flex-col items-start">
          <h1 className="text-3xl md:text-4xl font-medium">About us</h1>
          <div className="w-16 h-0.5 bg-orange-600 rounded-full mt-2" />
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center mt-10">
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p className="text-lg text-gray-800">
              N.S Gadget Hub is an online gadget store built for shoppers in Nepal.
            </p>
            <p>
              Buying electronics here usually means trekking between shops, comparing
              prices that change from counter to counter, and hoping the warranty means
              something. We started this store to make that simpler: one catalogue, one
              honest price per product, and a checkout that tells you the full amount
              before you commit.
            </p>
            <p>
              We stock the categories people actually ask for. Every listing carries the
              specification, the stock count and the real photograph of what ships, so you
              are not guessing from a stock image.
            </p>
          </div>

          <Image
            src="/images/feature-laptop.jpg"
            alt="Laptop and accessories on a desk"
            width={700}
            height={500}
            className="w-full h-72 object-cover rounded-xl"
            priority
          />
        </div>
      </section>

      <section className="mt-16 md:mt-20">
        <h2 className="text-2xl font-medium">What we sell</h2>
        <div className="flex flex-wrap gap-2 mt-5">
          {CATEGORIES.map((category) => (
            <span
              key={category}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-full text-gray-600"
            >
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-16 md:mt-20">
        <h2 className="text-2xl font-medium">What we promise</h2>
        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          {PROMISES.map(({ title, body }) => (
            <div key={title} className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 md:mt-20 bg-[#E6E9F2] rounded-xl px-6 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-medium max-w-md">
            Questions before you order?
          </h2>
          <p className="text-gray-600 mt-2">
            Call{" "}
            <a href="tel:+9779847306600" className="text-orange-600 hover:underline">
              +977-9847306600
            </a>{" "}
            or email{" "}
            <a
              href="mailto:contact@nsgadgethub.com"
              className="text-orange-600 hover:underline"
            >
              contact@nsgadgethub.com
            </a>
            .
          </p>
        </div>
        <Link
          href="/all-products"
          className="px-10 py-2.5 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition whitespace-nowrap"
        >
          Browse the shop
        </Link>
      </section>

      <div className="pb-16" />
    </main>

    <Footer />
  </>
);

export default AboutUs;

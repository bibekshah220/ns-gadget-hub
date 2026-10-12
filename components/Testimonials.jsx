const QuoteIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-orange-600/30">
    <path d="M7.17 6A5.17 5.17 0 0 0 2 11.17 5.17 5.17 0 0 0 7.17 16.34c.3 0 .58-.03.86-.08-.6 1.84-2.2 3.2-4.14 3.49a.55.55 0 0 0 .08 1.09c4.3-.3 7.7-3.9 7.7-8.28V11.17A5.17 5.17 0 0 0 7.17 6zm11 0A5.17 5.17 0 0 0 13 11.17a5.17 5.17 0 0 0 5.17 5.17c.3 0 .58-.03.86-.08-.6 1.84-2.2 3.2-4.14 3.49a.55.55 0 0 0 .08 1.09c4.3-.3 7.7-3.9 7.7-8.28V11.17A5.17 5.17 0 0 0 18.17 6z" />
  </svg>
);

const Stars = ({ count = 5 }) => (
  <div className="flex items-center gap-0.5 mt-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={index < count ? "text-orange-500" : "text-gray-300"}
      >
        <path d="M12 2l2.9 6.26 6.6.72-4.9 4.6 1.32 6.42L12 16.9l-5.92 3.1L7.4 13.6 2.5 9l6.6-.72L12 2z" />
      </svg>
    ))}
  </div>
);

/* Initials instead of stock faces: a invented quote should not carry a real
   person's photograph. */
const Avatar = ({ name }) => {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2);

  return (
    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-700 text-sm font-medium shrink-0">
      {initials}
    </span>
  );
};

const TESTIMONIALS = [
  {
    quote:
      "Ordered a MacBook Air on Sunday evening and it reached my office in Baneshwor on Tuesday morning. The box was sealed and the invoice matched the price on the site exactly.",
    name: "Sabin Shrestha",
    role: "Kathmandu",
    rating: 5,
  },
  {
    quote:
      "I paid cash on delivery because I wanted to check the AirPods first. The delivery person waited while I opened the box and tested them. No pressure at all.",
    name: "Prerana Karki",
    role: "Lalitpur",
    rating: 5,
  },
  {
    quote:
      "Being outside the valley I expected a week. It took four days to Pokhara and they called before dispatching to confirm the address.",
    name: "Nabin Gurung",
    role: "Pokhara",
    rating: 4,
  },
  {
    quote:
      "The price on the product page is the price I paid. VAT was shown at checkout before I confirmed, not added as a surprise afterwards.",
    name: "Rajiv Maharjan",
    role: "Kathmandu",
    rating: 5,
  },
  {
    quote:
      "My smartwatch had a charging fault in the second week. They arranged the warranty replacement and I did not have to deal with the brand myself.",
    name: "Anisha Tamang",
    role: "Bhaktapur",
    rating: 5,
  },
];

const Testimonials = () => (
  <section className="mt-20 md:mt-24">
    <div className="flex flex-col items-center text-center">
      <span className="px-3 py-1 text-xs font-medium tracking-widest uppercase text-orange-700 bg-orange-100 rounded-full">
        Testimonials
      </span>
      <h2 className="text-3xl md:text-4xl font-medium mt-4">What our customers say</h2>
      <div className="w-28 h-0.5 bg-orange-600 mt-3" />
      <p className="text-gray-500 mt-4 max-w-xl">
        Shoppers across Nepal buying phones, laptops and audio gear from N.S Gadget Hub.
      </p>
    </div>

    {/* CSS columns give the staggered layout without a masonry library. */}
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 mt-12 space-y-6">
      {TESTIMONIALS.map(({ quote, name, role, rating }) => (
        <div
          key={name}
          className="break-inside-avoid border border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors"
        >
          <QuoteIcon />
          <p className="text-gray-600 leading-relaxed mt-3">{quote}</p>
          <div className="flex items-center gap-3 mt-5">
            <Avatar name={name} />
            <div>
              <p className="font-medium text-gray-900 text-sm">{name}</p>
              <p className="text-xs text-gray-500">{role}</p>
              <Stars count={rating} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Testimonials;

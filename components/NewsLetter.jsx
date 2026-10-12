const NewsLetter = () => {
  return (
    <section
      aria-labelledby="newsletter-heading"
      className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14"
    >
      <h2 id="newsletter-heading" className="md:text-4xl text-2xl font-medium">
        Subscribe now & get 20% off
      </h2>
      {/* The old copy repeated the footer blurb and never said what the offer
          was or how it arrives. */}
      <p className="md:text-base text-gray-600 pb-8 max-w-xl">
        20% off your first order, code sent by email. One code per customer,
        valid for 30 days. Occasional stock alerts, unsubscribe any time.
      </p>
      <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none focus:border-orange-700 w-full rounded-r-none px-3 text-gray-700"
          type="email"
          autoComplete="email"
          placeholder="Enter your email id"
        />
        <button className="md:px-12 px-8 h-full text-white bg-orange-700 rounded-md rounded-l-none hover:bg-orange-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2">
          Subscribe
        </button>
      </div>
    </section>
  );
};

export default NewsLetter;

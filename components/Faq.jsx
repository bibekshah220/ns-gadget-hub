const FAQS = [
  {
    question: "How long does delivery take?",
    answer:
      "Inside the Kathmandu valley, orders usually arrive within two working days. Outside the valley it takes three to five days depending on the route. We call to confirm the address before dispatching.",
  },
  {
    question: "What payment methods can I use?",
    answer:
      "Cash on delivery, Khalti, eSewa, and card payments through Stripe. Pick the method you prefer at checkout; the total shown there is the final amount including 13% VAT.",
  },
  {
    question: "Can I check the product before paying?",
    answer:
      "Yes. Choose cash on delivery and the delivery person will wait while you open the box and confirm the product is what you ordered and in working condition.",
  },
  {
    question: "Do products come with a warranty?",
    answer:
      "Every product carries the manufacturer's warranty for Nepal. Keep the invoice we send with the order, and contact us first if something fails inside the warranty period so we can arrange it with the brand.",
  },
  {
    question: "What if I receive a damaged or wrong item?",
    answer:
      "Tell us within 48 hours of delivery with photographs and we will arrange a replacement or a full refund. Items damaged after delivery fall under the manufacturer's warranty instead.",
  },
  {
    question: "Are the products genuine?",
    answer:
      "Yes. We source from authorised distributors and check each item before listing it. Serial numbers are valid for warranty registration with the brand.",
  },
];

const Faq = () => (
  <section className="mt-20 md:mt-24">
    <div className="flex flex-col items-center text-center">
      <span className="px-3 py-1 text-xs font-medium tracking-widest uppercase text-orange-700 bg-orange-100 rounded-full">
        FAQ
      </span>
      <h2 className="text-3xl md:text-4xl font-medium mt-4">Frequently asked questions</h2>
      <div className="w-28 h-0.5 bg-orange-600 mt-3" />
      <p className="text-gray-500 mt-4 max-w-xl">
        Delivery, payment, warranty and returns. Anything else, send us a message.
      </p>
    </div>

    {/* Native <details> handles the open/close state, so there is no JS here. */}
    <div className="max-w-3xl mx-auto mt-12 flex flex-col gap-3">
      {FAQS.map(({ question, answer }) => (
        <details
          key={question}
          className="group border border-gray-200 rounded-xl px-5 py-4 open:border-orange-300 transition-colors"
        >
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-gray-900 marker:content-none">
            {question}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <p className="text-gray-600 leading-relaxed mt-3">{answer}</p>
        </details>
      ))}
    </div>
  </section>
);

export default Faq;

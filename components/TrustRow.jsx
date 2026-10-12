/* The four promises shoppers ask about before they trust a new store. */
const items = [
  {
    label: "Genuine products",
    detail: "Sourced from authorised distributors",
    path: "m9 12 2 2 4-4M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z",
  },
  {
    label: "Cash on delivery",
    detail: "Pay when the parcel reaches you",
    path: "M2 7h20v10H2zM12 12h.01M6 12h.01M18 12h.01",
  },
  {
    label: "48h returns",
    detail: "Report a fault within two days",
    path: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5",
  },
  {
    label: "Nepal warranty",
    detail: "Serviced locally, not shipped abroad",
    path: "M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z",
  },
];

const TrustRow = () => (
  <section aria-label="Why shop with us" className="mt-10 border-y border-gray-200 py-6">
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map(({ label, detail, path }) => (
        <li key={label} className="flex items-start gap-3">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 mt-0.5 text-orange-700"
          >
            <path d={path} />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">{detail}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

export default TrustRow;

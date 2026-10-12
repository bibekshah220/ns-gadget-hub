/* Shared star row so the card, the summary and the form all agree visually. */
const Stars = ({ value = 0, size = 14 }) => (
  <span className="inline-flex items-center gap-0.5" aria-hidden="true">
    {Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={index < Math.round(value) ? "text-orange-500" : "text-gray-300"}
      >
        <path d="M12 2l2.9 6.26 6.6.72-4.9 4.6 1.32 6.42L12 16.9l-5.92 3.1L7.4 13.6 2.5 9l6.6-.72L12 2z" />
      </svg>
    ))}
  </span>
);

export default Stars;

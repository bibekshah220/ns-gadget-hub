/* Brand marks for the checkout payment picker. Drawn locally rather than
   hotlinked, so the picker cannot render broken images if a brand CDN moves. */

const Wordmark = ({ color, children }) => (
  <span
    className="inline-flex items-center justify-center w-[72px] h-7 rounded text-white text-[13px] font-bold tracking-tight shrink-0"
    style={{ backgroundColor: color }}
  >
    {children}
  </span>
);

export const CodLogo = () => (
  <span className="inline-flex items-center justify-center w-[72px] h-7 rounded border border-gray-300 bg-white shrink-0">
    <svg viewBox="0 0 24 24" height="18" width="18" fill="none" stroke="#15803d" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  </span>
);

/* eSewa: white "e" on the brand green. */
export const EsewaLogo = () => (
  <Wordmark color="#60BB46">
    <span className="lowercase">eSewa</span>
  </Wordmark>
);

/* Khalti: brand purple. */
export const KhaltiLogo = () => <Wordmark color="#5C2D91">Khalti</Wordmark>;

/* Stripe handles the card rails, so the row reads as "Card" to shoppers. */
export const StripeLogo = () => (
  <Wordmark color="#635BFF">
    <svg viewBox="0 0 24 24" height="16" width="16" fill="currentColor" className="mr-1">
      <path d="M15.78 8.12c.58 0 1.3.18 1.72.35l.34-1.56c-.42-.17-1.15-.35-1.72-.35-1.97 0-3.35.98-3.37 2.44-.01 1.14 1.03 1.71 1.78 2.12.74.41.94.58.94.91 0 .47-.57.73-1.24.73-.72 0-1.08-.11-1.93-.47l-.35 1.63c.83.3 1.2.38 2.22.4 2.24 0 3.3-1.24 3.31-2.5.01-.6-.11-1.16-1.07-1.78-.84-.54-1.66-.79-1.66-1.29 0-.3.47-.62 1.23-.63z" />
    </svg>
    Card
  </Wordmark>
);

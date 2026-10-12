export const metadata = {
  title: "Cart",
  /* Private or transactional: no public content worth indexing. */
  robots: { index: false, follow: false },
};

export default function RouteLayout({ children }) {
  return children;
}

import SellerGuard from "@/components/seller/SellerGuard";

export const metadata = {
  title: "Seller Dashboard",
  /* Private: never index the dashboard. */
  robots: { index: false, follow: false },
};

export default function SellerLayout({ children }) {
  return <SellerGuard>{children}</SellerGuard>;
}

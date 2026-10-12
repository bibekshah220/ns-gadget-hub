"use client"
import { assets } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useState } from "react";

const CartIcon = () => (
  <Image src={assets.cart_icon} alt="" width={16} height={16} />
);
const BagIcon = () => (
  <Image src={assets.order_icon} alt="" width={16} height={16} />
);

/* Every header control is at least 44x44 so it stays tappable on a phone. */
const tapTarget =
  "inline-flex items-center justify-center min-w-11 min-h-11 rounded hover:text-gray-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2";

const Navbar = () => {

  const { isSeller, router, user, logout, getCartCount } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const cartCount = getCartCount();

  const onSearch = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();

    if (!term) return;

    setIsSearchOpen(false);
    router.push(`/all-products?search=${encodeURIComponent(term)}`);
  };

  const AccountMenu = () => (
    <div className="relative">
      <button
        onClick={() => setIsAccountMenuOpen((prev) => !prev)}
        aria-expanded={isAccountMenuOpen}
        className={`${tapTarget} gap-2 px-2`}
      >
        <Image src={assets.user_icon} alt="" />
        <span className="max-md:hidden">{user.name?.split(" ")[0]}</span>
      </button>

      {isAccountMenuOpen && (
        <div
          className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-md py-1 z-20"
          onMouseLeave={() => setIsAccountMenuOpen(false)}
        >
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50"
          >
            <CartIcon /> Cart
          </button>
          <button
            onClick={() => router.push("/my-orders")}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50"
          >
            <BagIcon /> My Orders
          </button>
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-40 bg-white px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold select-none whitespace-nowrap rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
        >
          <span className="text-orange-600">N.S</span> Gadget Hub
        </Link>
        <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
          <Link href="/" className="hover:text-gray-900 transition">
            Home
          </Link>
          <Link href="/all-products" className="hover:text-gray-900 transition">
            Shop
          </Link>
          <Link href="/about" className="hover:text-gray-900 transition">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-gray-900 transition">
            Contact
          </Link>

          {isSeller && <button onClick={() => router.push('/seller')} className="text-xs border px-4 py-1.5 rounded-full">Seller Dashboard</button>}

        </div>

        {/* One actions row for both breakpoints. The account control used to be
            written twice, shipping a duplicate button on every screen. */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-label="Search"
            aria-expanded={isSearchOpen}
            className={tapTarget}
          >
            <Image className="w-4 h-4" src={assets.search_icon} alt="" />
          </button>

          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className={`${tapTarget} relative`}
          >
            <Image className="w-5 h-5" src={assets.cart_icon} alt="" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-0 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-orange-700 text-white text-[11px] font-medium"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {user ? <AccountMenu /> : (
            <Link href="/login" className={`${tapTarget} gap-2 px-2`}>
              <Image src={assets.user_icon} alt="" />
              <span className="max-sm:hidden">Account</span>
            </Link>
          )}

          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            className={`${tapTarget} md:hidden`}
          >
            <Image src={assets.menu_icon} alt="" width={18} height={18} />
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <form onSubmit={onSearch} className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search gadgets"
            aria-label="Search products"
            className="w-full h-11 px-3 border border-gray-300 rounded outline-none focus:border-orange-700"
          />
          <button
            type="submit"
            className="h-11 px-4 rounded bg-orange-700 text-white hover:bg-orange-800 transition"
          >
            Search
          </button>
        </form>
      )}

      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-gray-200 flex flex-col gap-3">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-900 transition">
            Home
          </Link>
          <Link href="/all-products" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-900 transition">
            Shop
          </Link>
          <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-900 transition">
            About Us
          </Link>
          <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-900 transition">
            Contact
          </Link>
          {isSeller && (
            <button
              onClick={() => {
                router.push('/seller');
                setIsMobileMenuOpen(false);
              }}
              className="text-xs border px-4 py-2 rounded-full w-fit"
            >
              Seller Dashboard
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

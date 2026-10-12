"use client"
import { assets } from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useState } from "react";

const CartIcon = () => (
  <Image src={assets.cart_icon} alt="cart" width={16} height={16} />
);
const BagIcon = () => (
  <Image src={assets.order_icon} alt="orders" width={16} height={16} />
);

const Navbar = () => {

  const { isSeller, router, user, logout } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const AccountMenu = () => (
    <div className="relative">
      <button
        onClick={() => setIsAccountMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 hover:text-gray-900 transition"
      >
        <Image src={assets.user_icon} alt="user icon" />
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
    <nav className="px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      <div className="flex items-center justify-between">
        <span
          onClick={() => router.push('/')}
          className="cursor-pointer text-xl md:text-2xl font-bold select-none"
        >
          <span className="text-orange-600">N.S</span> Gadget Hub
        </span>
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

        <ul className="hidden md:flex items-center gap-4 ">
          <Image className="w-4 h-4" src={assets.search_icon} alt="" />
          {user ? <AccountMenu /> : (
            <button onClick={() => router.push('/login')} className="flex items-center gap-2 hover:text-gray-900 transition">
              <Image src={assets.user_icon} alt="user icon" />
              Account
            </button>
          )}
        </ul>

        <div className="flex items-center md:hidden gap-3">
          {user ? <AccountMenu /> : (
            <button onClick={() => router.push('/login')} className="flex items-center gap-2 hover:text-gray-900 transition">
              <Image src={assets.user_icon} alt="user icon" />
              Account
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            className="p-1"
          >
            <Image src={assets.menu_icon} alt="menu icon" width={18} height={18} />
          </button>
        </div>
      </div>

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

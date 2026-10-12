"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* Shared frame for the four auth screens so they stay visually identical. */
const AuthShell = ({ title, subtitle, children, footer }) => (
  <>
    <Navbar />
    <div className="flex items-center justify-center px-6 py-20 min-h-[60vh]">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium text-gray-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        <div className="mt-6 flex flex-col gap-4">{children}</div>
        {footer && <div className="mt-6 text-sm text-gray-500">{footer}</div>}
      </div>
    </div>
    <Footer />
  </>
);

export const AuthField = ({ label, ...props }) => (
  <label className="flex flex-col gap-1 text-sm text-gray-600">
    {label}
    <input
      className="px-3 py-2 border border-gray-300 rounded outline-none focus:border-orange-500"
      {...props}
    />
  </label>
);

export const AuthSubmit = ({ children, disabled }) => (
  <button
    type="submit"
    disabled={disabled}
    className="bg-orange-600 text-white py-2.5 rounded hover:bg-orange-700 transition disabled:opacity-60"
  >
    {children}
  </button>
);

export const AuthLink = ({ href, children }) => (
  <Link href={href} className="text-orange-600 hover:underline">
    {children}
  </Link>
);

export default AuthShell;

"use client";
import { useState } from "react";
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

export const AuthField = ({ label, type = "text", ...props }) => {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="flex flex-col gap-1 text-sm text-gray-600">
      {label}
      <span className="relative flex">
        <input
          type={isPassword && revealed ? "text" : type}
          className={`w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-orange-500 ${
            isPassword ? "pr-10" : ""
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((shown) => !shown)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            /* tabIndex -1 keeps the tab order email -> password -> submit. */
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
              {revealed && <path d="m4 4 16 16" />}
            </svg>
          </button>
        )}
      </span>
    </label>
  );
};

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

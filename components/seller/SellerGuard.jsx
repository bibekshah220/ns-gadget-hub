"use client";
import { useEffect } from "react";
import Navbar from "@/components/seller/Navbar";
import Sidebar from "@/components/seller/Sidebar";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";

/* Client-side gate for the seller dashboard. The API routes enforce the role
   independently, so this is navigation, not the security boundary. */
const SellerGuard = ({ children }) => {
  const { user, isSeller, authLoading, router } = useAppContext();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login?next=/seller");
    } else if (!isSeller) {
      router.replace("/");
    }
  }, [authLoading, user, isSeller]);

  if (authLoading || !user || !isSeller) {
    return <Loading />;
  }

  return (
    <div>
      <Navbar />
      <div className="flex w-full">
        <Sidebar />
        {children}
      </div>
    </div>
  );
};

export default SellerGuard;

"use client";
import { useAppContext } from "@/context/AppContext";
import { CodLogo, EsewaLogo, KhaltiLogo, StripeLogo } from "@/components/PaymentLogos";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
  { value: "COD", label: "Cash on Delivery", note: "Pay when the order arrives", Logo: CodLogo },
  { value: "Khalti", label: "Khalti", note: "Wallet, mobile banking, connectIPS", Logo: KhaltiLogo },
  { value: "eSewa", label: "eSewa", note: "Nepal's digital wallet", Logo: EsewaLogo },
  { value: "Stripe", label: "Card", note: "Visa, Mastercard via Stripe", Logo: StripeLogo },
];

const OrderSummary = () => {

  const {
    currency,
    router,
    user,
    cartItems,
    setCartItems,
    getCartCount,
    getCartAmount,
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  /* Load the signed-in user's saved addresses for the dropdown. */
  const fetchUserAddresses = async () => {
    try {
      const { data } = await axios.get("/api/user/get-address");

      if (data.success) {
        setUserAddresses(data.address);

        if (data.address.length > 0) {
          setSelectedAddress(data.address[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch addresses",
      );
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  /* Validate the cart and address, then submit the order to the backend. */
  const createOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    /* Flatten the cart map into a list of { product, quantity } line items. */
    const items = Object.keys(cartItems)
      .map((product) => ({ product, quantity: cartItems[product] }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      setIsPlacingOrder(true);
      const { data } = await axios.post(
        "/api/order/create",
        { address: selectedAddress._id, items, paymentMethod },
        { timeout: 15000 },
      );

      if (data.success) {
        if (paymentMethod === "Stripe" && data.payment_url) {
          window.location.href = data.payment_url;
        } else if (paymentMethod === "Khalti" && data.payment_url) {
          window.location.href = data.payment_url;
        } else if (paymentMethod === "eSewa" && data.esewa_data) {
          const form = document.createElement("form");
          form.setAttribute("method", "POST");
          form.setAttribute("action", data.esewa_data.url);
          for (const key in data.esewa_data.params) {
            const hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", data.esewa_data.params[key]);
            form.appendChild(hiddenField);
          }
          document.body.appendChild(form);
          form.submit();
        } else {
          toast.success(data.message || "Order placed successfully");
          setCartItems({});
          router.push("/order-placed");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  /* Fetch addresses once the user is available. */
  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Select Address
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
            />
            <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Apply
            </button>
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Payment Method
          </label>
          <div className="w-full rounded-lg flex flex-col gap-2">
            {PAYMENT_METHODS.map(({ value, label, note, Logo }) => (
              <label
                key={value}
                className="flex w-full items-center gap-3 rounded-lg p-2 border border-transparent cursor-pointer transition-colors hover:bg-slate-100 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-900"
              >
                <Logo />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{label}</span>
                  {note && <span className="block text-xs text-gray-500 truncate">{note}</span>}
                </span>
                <input
                  className="shrink-0 accent-indigo-500"
                  value={value}
                  name="payment"
                  type="radio"
                  checked={paymentMethod === value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">{currency}{getCartAmount()}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Tax (13%)</p>
            <p className="font-medium text-gray-800">{currency}{Math.floor(getCartAmount() * 0.13)}</p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>{currency}{getCartAmount() + Math.floor(getCartAmount() * 0.13)}</p>
          </div>
        </div>
      </div>

      <button
        onClick={createOrder}
        disabled={isPlacingOrder}
        className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
};

export default OrderSummary;
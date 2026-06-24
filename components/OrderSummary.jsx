import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {

  const {
    currency,
    router,
    user,
    getToken,
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

  /* Build the Authorization header from the Clerk token for protected requests. */
  const getAuthHeaders = async () => {
    const token = await getToken();

    if (!token) {
      throw new Error("Unauthorized");
    }

    return { Authorization: `Bearer ${token}` };
  };

  /* Load the signed-in user's saved addresses for the dropdown. */
  const fetchUserAddresses = async () => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axios.get("/api/user/get-address", { headers });

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
      const headers = await getAuthHeaders();

      const { data } = await axios.post(
        "/api/order/create",
        { address: selectedAddress._id, items, paymentMethod },
        { headers, timeout: 5000 },
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
            
            <label className="inline-flex justify-between w-full items-center z-10 rounded-lg p-2 border border-transparent has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-900 has-[:checked]:bg-indigo-50 has-[:checked]:font-bold hover:bg-slate-200 transition-all cursor-pointer has-[:checked]:transition-all has-[:checked]:duration-500 duration-500 relative [&_p]:has-[:checked]:translate-y-0 [&_p]:has-[:checked]:transition-transform [&_p]:has-[:checked]:duration-500 [&_p]:has-[:checked]:opacity-100 overflow-hidden">
              <div className="inline-flex items-center justify-center gap-2 relative z-10">
                <svg fill="currentColor" viewBox="0 0 24 24" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h14V6H5zm7 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"></path>
                </svg>
                <p className="font-semibold absolute inset-0 w-full whitespace-nowrap translate-y-[110%] translate-x-full top-1 left-2 transition-all duration-700 opacity-0">Cash on Delivery</p>
              </div>
              <input className="checked:text-indigo-500 checked:ring-0 checked:ring-current focus:ring-0 focus:ring-current" value="COD" name="payment" type="radio" checked={paymentMethod === "COD"} onChange={(e) => setPaymentMethod(e.target.value)} />
            </label>

            <label className="inline-flex justify-between w-full items-center z-10 rounded-lg p-2 border border-transparent has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-900 has-[:checked]:bg-indigo-50 has-[:checked]:font-bold hover:bg-slate-200 transition-all cursor-pointer has-[:checked]:transition-all has-[:checked]:duration-500 duration-500 relative [&_p]:has-[:checked]:translate-y-0 [&_p]:has-[:checked]:transition-transform [&_p]:has-[:checked]:duration-500 [&_p]:has-[:checked]:opacity-100 overflow-hidden">
              <div className="inline-flex items-center justify-center gap-2 relative z-10">
                <svg fill="currentColor" viewBox="0 0 24 24" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2h-2v2H5V5h14v2h2zm-2 2v6h4V9h-4zm2 2h-2v2h2v-2z"></path>
                </svg>
                <p className="font-semibold absolute inset-0 w-full whitespace-nowrap translate-y-[110%] translate-x-full top-1 left-2 transition-all duration-700 opacity-0">Khalti</p>
              </div>
              <input className="checked:text-indigo-500 checked:ring-0 checked:ring-current focus:ring-0 focus:ring-current" value="Khalti" name="payment" type="radio" checked={paymentMethod === "Khalti"} onChange={(e) => setPaymentMethod(e.target.value)} />
            </label>

            <label className="inline-flex justify-between w-full items-center z-10 rounded-lg p-2 border border-transparent has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-900 has-[:checked]:bg-indigo-50 has-[:checked]:font-bold hover:bg-slate-200 transition-all cursor-pointer has-[:checked]:transition-all has-[:checked]:duration-500 duration-500 relative [&_p]:has-[:checked]:translate-y-0 [&_p]:has-[:checked]:transition-transform [&_p]:has-[:checked]:duration-500 [&_p]:has-[:checked]:opacity-100 overflow-hidden">
              <div className="inline-flex items-center justify-center gap-2 relative z-10">
                <svg fill="currentColor" viewBox="0 0 24 24" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"></path>
                </svg>
                <p className="font-semibold absolute inset-0 w-full whitespace-nowrap translate-y-[110%] translate-x-full top-1 left-2 transition-all duration-700 opacity-0">eSewa</p>
              </div>
              <input className="checked:text-indigo-500 checked:ring-0 checked:ring-current focus:ring-0 focus:ring-current" value="eSewa" name="payment" type="radio" checked={paymentMethod === "eSewa"} onChange={(e) => setPaymentMethod(e.target.value)} />
            </label>

            <label className="inline-flex justify-between w-full items-center z-10 rounded-lg p-2 border border-transparent has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-900 has-[:checked]:bg-indigo-50 has-[:checked]:font-bold hover:bg-slate-200 transition-all cursor-pointer has-[:checked]:transition-all has-[:checked]:duration-500 duration-500 relative [&_p]:has-[:checked]:translate-y-0 [&_p]:has-[:checked]:transition-transform [&_p]:has-[:checked]:duration-500 [&_p]:has-[:checked]:opacity-100 overflow-hidden">
              <div className="inline-flex items-center justify-center gap-2 relative z-10">
                <svg fill="currentColor" height="32" width="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <g><path d="M0 0h24v24H0z" fill="none"></path><path d="M22.222 15.768l-.225-1.125h-2.514l-.4 1.117-2.015.004a4199.19 4199.19 0 0 1 2.884-6.918c.164-.391.455-.59.884-.588.328.003.863.003 1.606.001L24 15.765l-1.778.003zm-2.173-2.666h1.62l-.605-2.82-1.015 2.82zM7.06 8.257l2.026.002-3.132 7.51-2.051-.002a950.849 950.849 0 0 1-1.528-5.956c-.1-.396-.298-.673-.679-.804C1.357 8.89.792 8.71 0 8.465V8.26h3.237c.56 0 .887.271.992.827.106.557.372 1.975.8 4.254L7.06 8.257zm4.81.002l-1.602 7.508-1.928-.002L9.94 8.257l1.93.002zm3.91-.139c.577 0 1.304.18 1.722.345l-.338 1.557c-.378-.152-1-.357-1.523-.35-.76.013-1.23.332-1.23.638 0 .498.816.749 1.656 1.293.959.62 1.085 1.177 1.073 1.782-.013 1.256-1.073 2.495-3.309 2.495-1.02-.015-1.388-.101-2.22-.396l.352-1.625c.847.355 1.206.468 1.93.468.663 0 1.232-.268 1.237-.735.004-.332-.2-.497-.944-.907-.744-.411-1.788-.98-1.774-2.122.017-1.462 1.402-2.443 3.369-2.443z"></path></g>
                </svg>
                <p className="font-semibold absolute inset-0 w-full whitespace-nowrap translate-y-[110%] translate-x-full top-1 left-2 transition-all duration-700 opacity-0">Stripe</p>
              </div>
              <input className="checked:text-indigo-500 checked:ring-0 checked:ring-current focus:ring-0 focus:ring-current" value="Stripe" name="payment" type="radio" checked={paymentMethod === "Stripe"} onChange={(e) => setPaymentMethod(e.target.value)} />
            </label>

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
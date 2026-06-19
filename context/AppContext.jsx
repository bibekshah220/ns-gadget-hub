"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

/* Global app context shared across the whole client tree (products, cart, user). */
export const AppContext = createContext();

/* Convenience hook so components can read the context without importing useContext. */
export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const router = useRouter();

  /* Clerk auth: current signed-in user and token getter for protected API calls. */
  const { user } = useUser();
  const { getToken } = useAuth();

  /* Core client state. */
  const [products, setProducts] = useState([]); 
  const [userData, setUserData] = useState(false); 
  const [isSeller, setIsSeller] = useState(false); 
  const [cartItems, setCartItems] = useState({}); 

  /* Build the Authorization header from the Clerk token for protected requests. */
  const getAuthHeaders = async () => {
    const token = await getToken();

    if (!token) {
      throw new Error("Unauthorized");s
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  /* Load the full product catalog from the API into state. */
  const fetchProductData = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch product data");
    }
  };

  /* Fetch the signed-in user's record and hydrate the cart from the server. */
  const fetchUserData = async () => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axios.get("/api/user/data", {
        headers,
      });
      if (data.success) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch user account data",
      );
    }
  };

  /* Persist the cart to the backend for the logged-in user. */
  const syncCartWithServer = async (nextCart) => {
    const headers = await getAuthHeaders();

    const { data } = await axios.post(
      "/api/cart/update",
      { cartData: nextCart },
      { headers },
    );

    if (!data.success) {
      throw new Error(data.message || "Failed to update cart");
    }
  };

  /* Add one unit of a product to the cart (optimistic update, then server sync). */
  const addToCart = async (itemId) => {
    try {
      const cartData = structuredClone(cartItems || {});
      cartData[itemId] = (cartData[itemId] || 0) + 1;

      setCartItems(cartData);

      if (user) {
        await syncCartWithServer(cartData);
      }

      toast.success("Item added to cart successfully");
    } catch (error) {
      if (user) {
        await fetchUserData();
      }
      toast.error(error.response?.data?.message || "Failed to add to cart");
    }
  };

  /* Set an exact quantity for a product, or remove it when quantity is 0. */
  const updateCartQuantity = async (itemId, quantity) => {
    try {
      const cartData = structuredClone(cartItems || {});

      if (quantity === 0) {
        delete cartData[itemId];
      } else {
        cartData[itemId] = quantity;
      }

      setCartItems(cartData);

      if (user) {
        await syncCartWithServer(cartData);
      }
    } catch (error) {
      if (user) {
        await fetchUserData();
      }
      toast.error(error.response?.data?.message || "Failed to update cart quantity");
    }
  };

  /* Total number of items in the cart (sum of all quantities). */
  const getCartCount = () => {
    let totalCount = 0;

    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        totalCount += cartItems[itemId];
      }
    }

    return totalCount;
  };

  /* Total cart price using each product's offerPrice, rounded to 2 decimals. */
  const getCartAmount = () => {
    let totalAmount = 0;

    for (const itemId in cartItems) {
      const itemInfo = products.find((product) => product._id === itemId);

      if (!itemInfo || cartItems[itemId] <= 0) {
        continue;
      }

      totalAmount += itemInfo.offerPrice * cartItems[itemId];
    }

    return Math.floor(totalAmount * 100) / 100;
  };

  /* Load products once on mount. */
  useEffect(() => {
    fetchProductData();
  }, []);

  /* Load user data when signed in; clear it on sign-out. */
  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserData(false);
      setCartItems({});
    }
  }, [user]);

  /* Everything exposed to consumers of the context. */
  const value = {
    user,
    getToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    fetchProductData,
    cartItems,
    setCartItems,
    addToCart,
    updateCartQuantity,
    getCartCount,
    getCartAmount,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

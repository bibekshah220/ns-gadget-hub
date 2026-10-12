"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
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

  /* Core client state. The session itself lives in an httpOnly cookie, so the
     client only ever holds the profile the server hands back. */
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartItems, setCartItems] = useState({});

  const user = userData;
  const isSeller = userData?.role === "seller" || userData?.role === "admin";

  /* Load the full product catalog from the API into state. */
  const fetchProductData = async () => {
    try {
      setProductsLoading(true);
      const { data } = await axios.get("/api/product/list");

      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch product data");
    } finally {
      setProductsLoading(false);
    }
  };

  /* Resolve the session cookie into a profile; a 401 simply means signed out. */
  const fetchUserData = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/me");

      if (data.success) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
        return data.user;
      }
    } catch {
      setUserData(null);
      setCartItems({});
    } finally {
      setAuthLoading(false);
    }

    return null;
  }, []);

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } finally {
      setUserData(null);
      setCartItems({});
      router.push("/login");
    }
  };

  /* Persist the cart to the backend for the logged-in user. */
  const syncCartWithServer = async (nextCart) => {
    const { data } = await axios.post("/api/cart/update", { cartData: nextCart });

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

  /* Load products and resolve the session once on mount. */
  useEffect(() => {
    fetchProductData();
    fetchUserData();
  }, [fetchUserData]);

  /* Everything exposed to consumers of the context. */
  const value = {
    user,
    authLoading,
    logout,
    currency,
    router,
    isSeller,
    userData,
    setUserData,
    fetchUserData,
    products,
    productsLoading,
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

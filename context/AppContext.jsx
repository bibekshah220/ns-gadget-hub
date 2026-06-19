"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const router = useRouter();

  const { user } = useUser();
  const { getToken } = useAuth();

  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const getAuthHeaders = async () => {
    const token = await getToken();

    if (!token) {
      throw new Error("Unauthorized");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

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

  const getCartCount = () => {
    let totalCount = 0;

    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        totalCount += cartItems[itemId];
      }
    }

    return totalCount;
  };

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

  useEffect(() => {
    fetchProductData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserData(false);
      setCartItems({});
    }
  }, [user]);

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

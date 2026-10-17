"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "@/constants/cart";

/* Keystrokes and +/- taps arrive far faster than a round trip; without this
   every one of them became its own POST. */
const CART_SYNC_DEBOUNCE_MS = 400;

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

  /* The last cart the server confirmed, so a rejected write can roll back to
     something real instead of guessing. */
  const confirmedCartRef = useRef({});
  const pendingCartRef = useRef(null);
  const syncTimerRef = useRef(null);
  const inFlightRef = useRef(false);

  /* Mirrors cartItems so a mutation can read the current cart without
     depending on a closure that may be a render behind. */
  const cartRef = useRef({});

  /* Resolve the session cookie into a profile; a 401 simply means signed out. */
  const fetchUserData = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/me");

      if (data.success) {
        const serverCart = data.user.cartItems || {};

        setUserData(data.user);
        setCartItems(serverCart);
        cartRef.current = serverCart;
        confirmedCartRef.current = serverCart;
        return data.user;
      }
    } catch {
      setUserData(null);
      setCartItems({});
      cartRef.current = {};
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
      cartRef.current = {};
      router.push("/login");
    }
  };

  const pushCart = useCallback(async () => {
    if (inFlightRef.current || pendingCartRef.current === null) {
      return;
    }

    const nextCart = pendingCartRef.current;
    pendingCartRef.current = null;
    inFlightRef.current = true;

    try {
      const { data } = await axios.post("/api/cart/update", { cartData: nextCart });

      if (!data.success) {
        throw new Error(data.message);
      }

      confirmedCartRef.current = nextCart;
    } catch (error) {
      /* Roll back to the last confirmed cart rather than refetching the whole
         profile: that refetch is what used to wipe a cart the server had
         rejected for a single bad line. */
      const message = error.response?.data?.message || error.message;
      pendingCartRef.current = null;
      cartRef.current = confirmedCartRef.current;
      setCartItems(confirmedCartRef.current);
      toast.error(message || "Could not save your cart");
    } finally {
      inFlightRef.current = false;

      /* Edits landing mid-flight are coalesced into one follow-up write. */
      if (pendingCartRef.current !== null) {
        void pushCart();
      }
    }
  }, []);

  /* Debounce, so holding a quantity arrow costs one request rather than one
     per repeat. */
  const queueCartSync = useCallback(
    (nextCart) => {
      pendingCartRef.current = nextCart;

      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(pushCart, CART_SYNC_DEBOUNCE_MS);
    },
    [pushCart],
  );

  /* A queued write must not die with the tab. */
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(syncTimerRef.current);
        void pushCart();
      }
    };

    document.addEventListener("visibilitychange", flush);

    return () => {
      document.removeEventListener("visibilitychange", flush);
      clearTimeout(syncTimerRef.current);
    };
  }, [pushCart]);

  /**
   * Single entry point for every cart mutation.
   *
   * The next cart is computed from cartRef, not from the cartItems closure,
   * which used to be a render behind and dropped increments when two clicks
   * landed in the same batch. Nothing here runs inside the setState updater:
   * React is free to call an updater more than once, which would double every
   * toast and every sync.
   */
  const mutateCart = useCallback(
    (updater) => {
      const next = updater({ ...cartRef.current });

      if (!next) {
        return;
      }

      if (Object.keys(next).length > MAX_CART_LINES) {
        toast.error(`A cart holds at most ${MAX_CART_LINES} different products`);
        return;
      }

      cartRef.current = next;
      setCartItems(next);

      if (user) {
        queueCartSync(next);
      }
    },
    [queueCartSync, user],
  );

  /* Add one unit of a product to the cart (optimistic, synced in the background). */
  const addToCart = useCallback(
    (itemId) => {
      mutateCart((cart) => {
        const quantity = (cart[itemId] || 0) + 1;

        if (quantity > MAX_QUANTITY_PER_ITEM) {
          toast.error(`At most ${MAX_QUANTITY_PER_ITEM} of one product`);
          return null;
        }

        cart[itemId] = quantity;
        return cart;
      });

      toast.success("Item added to cart successfully");
    },
    [mutateCart],
  );

  /* Set an exact quantity for a product, or remove it when quantity is 0. */
  const updateCartQuantity = useCallback(
    (itemId, quantity) => {
      mutateCart((cart) => {
        /* An empty number input reads as NaN here; treating it as 0 deleted the
           row out from under someone who was still typing. */
        if (!Number.isFinite(quantity)) {
          return null;
        }

        const wanted = Math.floor(quantity);

        if (wanted <= 0) {
          delete cart[itemId];
          return cart;
        }

        cart[itemId] = Math.min(wanted, MAX_QUANTITY_PER_ITEM);
        return cart;
      });
    },
    [mutateCart],
  );

  /* Indexed once per catalog load; the cart used to scan the whole product
     array for every line on every render. */
  const productsById = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products],
  );

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((total, qty) => (qty > 0 ? total + qty : total), 0),
    [cartItems],
  );

  const cartAmount = useMemo(() => {
    let total = 0;

    for (const [itemId, quantity] of Object.entries(cartItems)) {
      const product = productsById.get(itemId);

      if (product && quantity > 0) {
        total += product.offerPrice * quantity;
      }
    }

    return Math.floor(total * 100) / 100;
  }, [cartItems, productsById]);

  /* Kept as functions: every caller already invokes them. */
  const getCartCount = useCallback(() => cartCount, [cartCount]);
  const getCartAmount = useCallback(() => cartAmount, [cartAmount]);

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
    productsById,
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

'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { OrderStatusBadge } from "@/components/OrderStatus";
import { formatNpr } from "@/lib/money";
import { CANCELLABLE_FROM, NEXT_ACTION_LABEL, NEXT_STATUS } from "@/lib/orderStatus";

const Orders = () => {

    const { user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);

    const fetchSellerOrders = async () => {
        try {
            const { data } = await axios.get("/api/order/seller-orders");

            if (data.success) {
                setOrders(data.orders);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    }

    const updateStatus = async (orderId, status) => {
        setSavingId(orderId);

        try {
            const { data } = await axios.post("/api/order/update-status", { orderId, status });

            if (!data.success) {
                toast.error(data.message);
                return;
            }

            /* Patch the row in place rather than refetching the whole list. */
            setOrders((prev) => prev.map((order) => (
                order._id === orderId ? { ...order, status: data.status } : order
            )));

            toast.success(
                status === "approved"
                    ? "Order approved. The buyer has been notified."
                    : status === "completed"
                        ? "Order completed. The buyer has been notified."
                        : "Order updated.",
            );
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update the order");
        } finally {
            setSavingId(null);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
                <h2 className="text-lg font-medium">Orders</h2>
                <div className="max-w-4xl rounded-md">
                    {orders.map((order) => {
                        const next = NEXT_STATUS[order.status];
                        const busy = savingId === order._id;

                        return (
                        <div key={order._id} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
                            <div className="flex-1 flex gap-5 max-w-80">
                                <Image
                                    className="max-w-16 max-h-16 object-cover"
                                    src={assets.box_icon}
                                    alt=""
                                />
                                <p className="flex flex-col gap-3">
                                    <span className="font-medium">
                                        {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                    </span>
                                    <span>Items : {order.items.length}</span>
                                </p>
                            </div>
                            <div>
                                <p>
                                    <span className="font-medium">{order.address.fullName}</span>
                                    <br />
                                    <span >{order.address.area}</span>
                                    <br />
                                    <span>{`${order.address.city}, ${order.address.state}`}</span>
                                    <br />
                                    <span>{order.address.phoneNumber}</span>
                                </p>
                            </div>
                            <p className="font-medium my-auto">{formatNpr(order.amount)}</p>
                            <div className="flex flex-col gap-2">
                                <p className="flex flex-col">
                                    <span>Method : {order.paymentMethod}</span>
                                    <span>Date : {new Date(order.date).toLocaleDateString()}</span>
                                    <span>Payment : {order.paymentStatus}</span>
                                </p>
                                <OrderStatusBadge status={order.status} />
                                <div className="flex flex-wrap gap-2">
                                    {next && (
                                        <button
                                            onClick={() => updateStatus(order._id, next)}
                                            disabled={busy}
                                            className="min-h-11 px-4 rounded bg-orange-700 text-white hover:bg-orange-800 transition disabled:opacity-60"
                                        >
                                            {busy ? "Saving..." : NEXT_ACTION_LABEL[next]}
                                        </button>
                                    )}
                                    {CANCELLABLE_FROM.includes(order.status) && (
                                        <button
                                            onClick={() => updateStatus(order._id, "cancelled")}
                                            disabled={busy}
                                            className="min-h-11 px-4 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>}
            <Footer />
        </div>
    );
};

export default Orders;

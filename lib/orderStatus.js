/* One vocabulary for the order lifecycle, shared by the API, the seller
   dashboard and the buyer's order list so the three cannot drift.

   "pending" is not part of the track: it means an online payment has not
   cleared yet, and lib/payment.js moves the order to "order placed" when it
   does. */

export const ORDER_STATUSES = [
  "order placed",
  "pending",
  "approved",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
];

/* The steps a buyer sees on the tracker, in order. */
export const TRACK_STEPS = [
  "order placed",
  "approved",
  "shipped",
  "delivered",
  "completed",
];

export const STATUS_LABELS = {
  "order placed": "Order placed",
  pending: "Awaiting payment",
  approved: "Approved",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

/* The single status a seller may move an order to from where it is now. One
   step at a time, so an order cannot jump from placed to completed. */
export const NEXT_STATUS = {
  "order placed": "approved",
  approved: "shipped",
  shipped: "delivered",
  delivered: "completed",
};

/* What the seller's button says for that move. */
export const NEXT_ACTION_LABEL = {
  approved: "Approve order",
  shipped: "Mark shipped",
  delivered: "Mark delivered",
  completed: "Mark completed",
};

/* Cancellation is only offered before the parcel leaves. */
export const CANCELLABLE_FROM = ["order placed", "pending", "approved"];

export const isTerminal = (status) => status === "completed" || status === "cancelled";

export const canTransition = (from, to) =>
  NEXT_STATUS[from] === to || (to === "cancelled" && CANCELLABLE_FROM.includes(from));

/* Index of a status on the tracker; -1 for anything off it. */
export const trackIndex = (status) => TRACK_STEPS.indexOf(status);

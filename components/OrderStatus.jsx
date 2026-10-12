import { STATUS_LABELS, TRACK_STEPS, trackIndex } from "@/lib/orderStatus";

const badgeTones = {
  "order placed": "bg-gray-100 text-gray-700",
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-blue-50 text-blue-800",
  shipped: "bg-indigo-50 text-indigo-800",
  delivered: "bg-emerald-50 text-emerald-800",
  completed: "bg-emerald-600 text-white",
  cancelled: "bg-red-50 text-red-700",
};

export const OrderStatusBadge = ({ status }) => (
  <span
    className={`inline-flex self-start w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium ${
      badgeTones[status] || badgeTones["order placed"]
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

/* Buyer-facing progress through the lifecycle. Cancelled orders leave the
   track, so they get the badge alone rather than a half-filled bar. */
export const OrderTracker = ({ status, history = [] }) => {
  if (status === "cancelled") {
    return null;
  }

  const current = trackIndex(status);
  const reachedAt = (step) => history.find((entry) => entry.status === step)?.at;

  return (
    <ol className="flex flex-wrap items-start gap-x-2 gap-y-3">
      {TRACK_STEPS.map((step, index) => {
        const done = index <= current;
        const at = reachedAt(step);

        return (
          <li key={step} className="flex items-center gap-2">
            <span className="flex flex-col items-center min-w-20">
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${done ? "bg-orange-700" : "bg-gray-300"}`}
              />
              <span className={`mt-1 text-[11px] text-center ${done ? "text-gray-900" : "text-gray-400"}`}>
                {STATUS_LABELS[step]}
              </span>
              {at && (
                <span className="text-[10px] text-gray-400">
                  {new Date(at).toLocaleDateString()}
                </span>
              )}
            </span>
            {index < TRACK_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px w-6 ${index < current ? "bg-orange-700" : "bg-gray-300"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

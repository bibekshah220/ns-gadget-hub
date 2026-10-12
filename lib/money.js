/* Prices are stored as plain NPR numbers, so every surface formats them the
   same way here rather than concatenating a currency symbol by hand. */
const nprFormatter = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

export const formatNpr = (amount) => nprFormatter.format(Number(amount) || 0);

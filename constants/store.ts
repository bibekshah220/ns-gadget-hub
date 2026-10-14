/* Storefront contact details. */
export const STORE = {
  phone: "+977-9847306600",
  email: "contact@nsgadgethub.com",
  address: "New Road, Kathmandu, Nepal",
  hours: "Open daily, 8 AM to 10 PM",
  /* Full international form, digits only. */
  whatsappNumber: "9779847306600",
};

export const whatsappHref = (number: string) =>
  number === "TODO" ? null : `https://wa.me/${number}`;

/* Storefront contact details. The TODO values are placeholders and must be
   replaced before launch; nothing here is invented customer-facing data. */
export const STORE = {
  phone: "+977-9847306600",
  email: "contact@nsgadgethub.com",
  /* TODO: add address */
  address: "TODO: add address",
  /* TODO: add store hours */
  hours: "TODO: add store hours",
  /* TODO: add the WhatsApp business number in full international form,
     digits only, e.g. 9779800000000 */
  whatsappNumber: "TODO",
};

export const whatsappHref = (number: string) =>
  number === "TODO" ? null : `https://wa.me/${number}`;

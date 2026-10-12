/* Profile URLs live here so the footer never hardcodes a brand handle.
   TODO: replace every placeholder href with the real profile. */
export type SocialLink = {
  id: "facebook" | "instagram" | "tiktok";
  label: string;
  href: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "facebook",
    label: "N.S Gadget Hub on Facebook",
    href: "https://facebook.com/TODO-ns-gadget-hub",
  },
  {
    id: "instagram",
    label: "N.S Gadget Hub on Instagram",
    href: "https://instagram.com/TODO-ns-gadget-hub",
  },
  {
    id: "tiktok",
    label: "N.S Gadget Hub on TikTok",
    href: "https://tiktok.com/@TODO-ns-gadget-hub",
  },
];

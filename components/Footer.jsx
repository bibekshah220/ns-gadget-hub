import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { SOCIAL_LINKS } from "@/constants/social";
import { STORE, whatsappHref } from "@/constants/store";
import { CodLogo, EsewaLogo, KhaltiLogo, StripeLogo } from "@/components/PaymentLogos";

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.5 0h-3.07v16.36a2.79 2.79 0 1 1-2.79-2.79c.16 0 .31.02.46.05v-3.13a6.04 6.04 0 0 0-.46-.02 5.92 5.92 0 1 0 5.92 5.92V8.4a7.6 7.6 0 0 0 4.44 1.42V6.7a4.45 4.45 0 0 1-4.5-4.5V0z" />
  </svg>
);

const socialIcons = {
  facebook: <Image src={assets.facebook_icon} alt="" />,
  instagram: <Image src={assets.instagram_icon} alt="" />,
  tiktok: <TikTokIcon />,
};

const whatsapp = whatsappHref(STORE.whatsappNumber);

const Footer = () => {
  return (
    <footer>
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
        <div className="md:w-2/5">
          <span className="text-xl md:text-2xl font-bold select-none">
            <span className="text-orange-600">N.S</span> Gadget Hub
          </span>
          <p className="mt-6 text-sm">
            Your one-stop destination for the latest gadgets and tech
            accessories. Quality products delivered right to your door.
          </p>

          <h2 className="font-medium text-gray-900 mt-8 mb-3 text-sm">We accept</h2>
          <ul className="flex flex-wrap items-center gap-2">
            <li><KhaltiLogo /></li>
            <li><EsewaLogo /></li>
            <li><StripeLogo /></li>
            <li><CodLogo /></li>
          </ul>
        </div>

        <div className="md:w-1/5 flex items-center justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Company</h2>
            <ul className="text-sm space-y-2">
              <li>
                <Link className="hover:underline transition" href="/">Home</Link>
              </li>
              <li>
                <Link className="hover:underline transition" href="/about">About us</Link>
              </li>
              <li>
                <Link className="hover:underline transition" href="/contact">Contact us</Link>
              </li>
              <li>
                <Link className="hover:underline transition" href="/privacy">Privacy policy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="md:w-2/5 flex items-start justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Get in touch</h2>
            <div className="text-sm space-y-2">
              <p>{STORE.phone}</p>
              <p>{STORE.email}</p>
              <p>{STORE.address}</p>
              <p>{STORE.hours}</p>
              {whatsapp ? (
                <p>
                  <a
                    className="hover:underline transition"
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat on WhatsApp
                  </a>
                </p>
              ) : (
                <p>TODO: add WhatsApp number</p>
              )}
              <div className="flex items-center gap-1 pt-2">
                {SOCIAL_LINKS.map(({ id, label, href }) => (
                  <a
                    key={id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex items-center justify-center min-w-11 min-h-11 rounded hover:opacity-70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
                  >
                    {socialIcons[id]}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="py-4 text-center text-xs md:text-sm">
        Copyright 2026 © N.S Gadget Hub All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;

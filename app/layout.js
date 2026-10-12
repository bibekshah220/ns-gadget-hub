import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "N.S Gadget Hub — Buy Gadgets Online in Nepal",
    /* Page titles become "About us | N.S Gadget Hub". */
    template: "%s | N.S Gadget Hub",
  },
  description:
    "Online gadget store in Nepal. Genuine smartphones, laptops, headphones, smartwatches, cameras and accessories with cash on delivery, Khalti, eSewa and card payments.",
  keywords: [
    "gadget store Nepal",
    "buy laptop Nepal",
    "smartphone price Nepal",
    "headphones Nepal",
    "online electronics Nepal",
    "cash on delivery Nepal",
  ],
  applicationName: "N.S Gadget Hub",
  openGraph: {
    type: "website",
    siteName: "N.S Gadget Hub",
    locale: "en_NP",
    url: siteUrl,
    title: "N.S Gadget Hub — Buy Gadgets Online in Nepal",
    description:
      "Genuine gadgets delivered across Nepal. Cash on delivery, Khalti, eSewa and card.",
    images: [{ url: "/images/hero-headphones.jpg", width: 700, height: 700, alt: "N.S Gadget Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "N.S Gadget Hub — Buy Gadgets Online in Nepal",
    description:
      "Genuine gadgets delivered across Nepal. Cash on delivery, Khalti, eSewa and card.",
    images: ["/images/hero-headphones.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: true, address: false, email: true },
};

export const viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
};

/* Tells search engines what this site is and how to search it. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": `${siteUrl}/#store`,
      name: "N.S Gadget Hub",
      url: siteUrl,
      description:
        "Online gadget store in Nepal selling smartphones, laptops, headphones, smartwatches, cameras and accessories.",
      telephone: "+977-9847306600",
      email: "contact@nsgadgethub.com",
      address: { "@type": "PostalAddress", addressCountry: "NP" },
      areaServed: { "@type": "Country", name: "Nepal" },
      currenciesAccepted: "NPR",
      paymentAccepted: "Cash on Delivery, Khalti, eSewa, Credit Card, Debit Card",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "N.S Gadget Hub",
      publisher: { "@id": `${siteUrl}/#store` },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased text-gray-700`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Toaster />
        <AppContextProvider>{children}</AppContextProvider>
      </body>
    </html>
  );
}

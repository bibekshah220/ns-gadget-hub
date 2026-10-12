import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { STORE } from "@/constants/store";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How N.S Gadget Hub collects, uses and protects the personal information of shoppers in Nepal.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "What we collect",
    body: "Your name, email address, phone number and delivery address when you create an account or place an order, plus the contents of your cart and your order history.",
  },
  {
    title: "Why we collect it",
    body: "To process and deliver orders, to contact you about an order, and to handle returns and warranty claims.",
  },
  {
    title: "Payments",
    body: "Card payments are handled by Stripe, and digital wallet payments by Khalti and eSewa. Card numbers and wallet credentials are entered on the provider's side and are never stored on our servers.",
  },
  {
    title: "Who we share it with",
    body: "Delivery partners receive the name, phone number and address needed to complete a delivery. Payment providers receive the amount and order reference. Nobody else receives your data, and we do not sell it.",
  },
  {
    title: "How long we keep it",
    body: "Order records are kept for as long as warranty and accounting obligations require. You can ask us to delete your account at any time.",
  },
  {
    title: "Cookies",
    body: "A session cookie keeps you signed in. It is removed when you sign out or when the session expires.",
  },
  {
    title: "Your choices",
    body: `Write to ${STORE.email} to see, correct or delete the information we hold about you.`,
  },
];

const Privacy = () => (
  <>
    <Navbar />
    <main className="px-6 md:px-16 lg:px-32 py-14 max-w-3xl">
      <h1 className="text-2xl font-medium">Privacy policy</h1>
      <div className="w-16 h-0.5 bg-orange-600 rounded-full mt-2" />

      <p className="mt-6 text-sm text-gray-600">
        {/* TODO: replace with the date this policy is published. */}
        Last updated: TODO: add date
      </p>

      <div className="mt-8 space-y-7">
        {SECTIONS.map(({ title, body }) => (
          <section key={title}>
            <h2 className="font-medium text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600 leading-6">{body}</p>
          </section>
        ))}

        <section>
          <h2 className="font-medium text-gray-900">Contact</h2>
          <p className="mt-2 text-sm text-gray-600 leading-6">
            {STORE.email} · {STORE.phone}
            <br />
            {STORE.address}
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </>
);

export default Privacy;

"use client";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CHANNELS = [
  {
    label: "Phone",
    value: "+977-9847306600",
    href: "tel:+9779847306600",
    note: "Sunday to Friday, 10am to 6pm",
  },
  {
    label: "Email",
    value: "contact@nsgadgethub.com",
    href: "mailto:contact@nsgadgethub.com",
    note: "We reply within one working day",
  },
];

const ADDRESS = "New Road, Kathmandu, Nepal";
/* Keyless Google Maps embed: no API key, no billing account. */
const MAP_SRC =
  "https://maps.google.com/maps?q=New%20Road%2C%20Kathmandu%2C%20Nepal&t=&z=16&ie=UTF8&iwloc=&output=embed";
const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=New+Road%2C+Kathmandu%2C+Nepal";

const EMPTY = { name: "", email: "", subject: "", message: "", website: "" };

const Contact = () => {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await axios.post("/api/contact", form);

      if (data.success) {
        toast.success(data.message);
        setForm(EMPTY);
        setSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send the message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="px-6 md:px-16 lg:px-32">
        <div className="flex flex-col items-start pt-12 md:pt-16">
          <h1 className="text-3xl md:text-4xl font-medium">Contact us</h1>
          <div className="w-16 h-0.5 bg-orange-600 rounded-full mt-2" />
        </div>

        <p className="text-gray-600 mt-4 max-w-2xl">
          Questions about an order, a product, or a return? Send a message and we will
          get back to you. If it is about an existing order, include the order number.
        </p>

        <div className="grid md:grid-cols-[1fr_320px] gap-10 lg:gap-16 mt-10 pb-16">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm text-gray-600">
                Your name
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={update("name")}
                  className="px-3 py-2 border border-gray-300 rounded outline-none focus:border-orange-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-600">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  className="px-3 py-2 border border-gray-300 rounded outline-none focus:border-orange-500"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Subject
              <input
                required
                maxLength={120}
                value={form.subject}
                onChange={update("subject")}
                className="px-3 py-2 border border-gray-300 rounded outline-none focus:border-orange-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Message
              <textarea
                required
                rows={7}
                minLength={10}
                maxLength={4000}
                value={form.message}
                onChange={update("message")}
                className="px-3 py-2 border border-gray-300 rounded outline-none focus:border-orange-500 resize-y"
              />
            </label>

            {/* Honeypot: hidden from people, tempting to bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={update("website")}
              className="hidden"
              aria-hidden="true"
            />

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-2.5 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send message"}
              </button>
              {sent && (
                <span className="text-sm text-green-700">Message received.</span>
              )}
            </div>
          </form>

          <aside className="space-y-6">
            {CHANNELS.map(({ label, value, href, note }) => (
              <div key={label} className="border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500">{label}</p>
                <a href={href} className="block text-orange-600 font-medium mt-1 hover:underline break-all">
                  {value}
                </a>
                <p className="text-xs text-gray-500 mt-1">{note}</p>
              </div>
            ))}

            <div className="border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500">Store</p>
              <address className="not-italic text-gray-800 font-medium mt-1">
                {ADDRESS}
              </address>
              <p className="text-xs text-gray-500 mt-1">
                Sunday to Friday, 10am to 6pm
              </p>
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-orange-600 hover:underline mt-2"
              >
                Get directions
              </a>
            </div>

            <div className="border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500">Orders</p>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                Track an order from{" "}
                <a href="/my-orders" className="text-orange-600 hover:underline">
                  My Orders
                </a>{" "}
                once you are signed in.
              </p>
            </div>
          </aside>
        </div>
        <section className="pb-16">
          <h2 className="text-2xl font-medium text-gray-800">Find us</h2>
          <p className="text-gray-600 mt-1">{ADDRESS}</p>
          <div className="mt-5 rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={MAP_SRC}
              title={`Map showing ${ADDRESS}`}
              width="100%"
              height="420"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block w-full border-0"
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Contact;

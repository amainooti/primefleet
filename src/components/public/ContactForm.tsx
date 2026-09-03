"use client";

import { useState } from "react";
import Link from "next/link";

const CONTACT_EMAIL = "rentalprimefleet@gmail.com";
const CONTACT_PHONE = "+1 818 275 0595";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create mailto link with pre-filled data
    const subject = `Contact Request from ${formData.name}`;
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`;
    const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
    setSubmitted(true);

    // Reset form after a delay
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", message: "" });
      setSubmitted(false);
    }, 500);
  };

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left Column - Contact Info */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#141414]">
              Get in Touch
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#6B6E76]">
              Have questions about our fleet? Ready to schedule a rental? We'd
              love to hear from you. Reach out and our team will respond promptly.
            </p>

            <div className="mt-12 space-y-8">
              {/* Email */}
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-[#E4E4E2] bg-[#F7F7F6]">
                  <svg
                    className="h-6 w-6 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#6B6E76]">Email</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-1 text-lg font-semibold text-[#141414] transition-colors hover:text-[#D4AF37]"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-[#E4E4E2] bg-[#F7F7F6]">
                  <svg
                    className="h-6 w-6 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#6B6E76]">Phone</p>
                  <a
                    href={`tel:${CONTACT_PHONE.replace(/[^\d+]/g, "")}`}
                    className="mt-1 text-lg font-semibold text-[#141414] transition-colors hover:text-[#D4AF37]"
                  >
                    {CONTACT_PHONE}
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-[#E4E4E2] bg-[#F7F7F6]">
                  <svg
                    className="h-6 w-6 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#6B6E76]">Location</p>
                  <p className="mt-1 text-lg font-semibold text-[#141414]">
                    Austin, TX
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-sm text-[#6B6E76]">
                Response time: Typically within 24 hours on weekdays.
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="rounded-lg border border-[#E4E4E2] bg-[#F7F7F6] p-8">
            <h2 className="text-xl font-bold text-[#141414]">Send us a message</h2>

            {submitted ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="font-semibold text-green-800">
                  Thank you for reaching out!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Your email client is opening with your message ready to send.
                  If it doesn't open, please use the contact details on the left
                  to reach us directly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-[#141414]"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded border border-[#E4E4E2] bg-white px-3 py-2 text-[#141414] placeholder-[#6B6E76] transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-[#141414]"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded border border-[#E4E4E2] bg-white px-3 py-2 text-[#141414] placeholder-[#6B6E76] transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-[#141414]"
                  >
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-2 w-full rounded border border-[#E4E4E2] bg-white px-3 py-2 text-[#141414] placeholder-[#6B6E76] transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="(555) 000-0000"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-[#141414]"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="mt-2 w-full rounded border border-[#E4E4E2] bg-white px-3 py-2 text-[#141414] placeholder-[#6B6E76] transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="Tell us about your inquiry..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full rounded bg-[#141414] px-4 py-3 font-semibold text-[#D4AF37] transition-all hover:bg-[#D4AF37] hover:text-[#141414]"
                >
                  Send Message
                </button>

                <p className="text-center text-xs text-[#6B6E76]">
                  This will open your email client with your message ready to
                  send.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

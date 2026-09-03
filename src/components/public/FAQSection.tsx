"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "Do I need to create an account to rent?",
    answer:
      "No account required. Browse the inventory, find the truck or trailer you need, and reach out through the listing's inquiry form — we'll follow up directly.",
  },
  {
    question: "Is Prime Fleet a marketplace with multiple sellers?",
    answer:
      "No. Every listing is our own inventory, inspected and maintained by us — not a third-party seller pass-through.",
  },
  {
    question: "What's included in the rate shown on a listing?",
    answer:
      "The rate displayed on each listing reflects the base rental price for that unit. Reach out through the inquiry form for a full quote covering your specific dates and needs.",
  },
  {
    question: "Can I pick up equipment same-day?",
    answer:
      "Availability depends on the unit and location. Submit an inquiry with your timeline and we'll confirm what's possible.",
  },
  {
    question: "Do you offer long-term or fleet rental agreements?",
    answer:
      "Yes — reach out through the inquiry form or contact us directly to discuss long-term or multi-unit arrangements.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-t border-[#E4E4E2] bg-[#F7F7F6]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
          Frequently asked questions
        </h2>

        <div className="mt-6 divide-y divide-[#E4E4E2] border-t border-[#E4E4E2]">
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-semibold text-[#141414]">
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 text-xl text-[#D4AF37] transition-transform ${
                      open ? "rotate-45" : ""
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                {open && (
                  <p className="pb-5 text-sm leading-relaxed text-[#6B6E76]">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
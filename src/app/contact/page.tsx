import { ContactForm } from "@/components/public/ContactForm";
import { PublicShell } from "@/components/public/PublicShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Prime Fleet Rentals",
  description:
    "Get in touch with Prime Fleet Rentals. Questions about our truck and equipment rental fleet? We're here to help.",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <ContactForm />
    </PublicShell>
  );
}

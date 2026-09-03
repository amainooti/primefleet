"use server";

import { prisma } from "@/lib/db/client";
import { inquirySchema } from "@/lib/validation/inquiry";

export type InquiryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "phone" | "message", string>>;
};

export async function submitInquiry(
  truckId: string,
  _prevState: InquiryFormState,
  formData: FormData
): Promise<InquiryFormState> {
  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: NonNullable<InquiryFormState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (field) fieldErrors[field] = issue.message;
    }
    return {
      status: "error",
      fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  await prisma.inquiry.create({
    data: {
      truckId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
    },
  });

  return {
    status: "success",
    message: "Thanks — we'll be in touch shortly.",
  };
}
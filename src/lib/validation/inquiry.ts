import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});
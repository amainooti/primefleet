import { z } from "zod";

export const truckSchema = z.object({
  slug: z.string().min(1),
  stockNumber: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  condition: z.enum(["NEW", "USED"]),
  status: z.enum(["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "ARCHIVED"]),
  rateDisplay: z.string().min(1),
  location: z.string().optional(),
});

export const specificationSchema = z.object({
  group: z.string().min(1),
  name: z.string().min(1),
  value: z.string().min(1),
});
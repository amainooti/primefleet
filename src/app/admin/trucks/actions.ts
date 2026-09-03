"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { truckSchema, specificationSchema } from "@/lib/validation/truck";
import { addTruckImages } from "./images-actions";

const specsArraySchema = z.array(specificationSchema);

function parseSpecs(formData: FormData) {
  const raw = formData.get("specifications");
  return specsArraySchema.parse(JSON.parse(typeof raw === "string" ? raw : "[]"));
}

export async function createTruck(formData: FormData) {
  const parsed = truckSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const specs = parseSpecs(formData);

  const truck = await prisma.truck.create({
    data: {
      ...parsed.data,
      specifications: { create: specs.map((s, i) => ({ ...s, sortOrder: i })) },
    },
  });

  await addTruckImages(truck.id, formData);

  revalidatePath("/admin/trucks");
  redirect("/admin/trucks");
}

export async function updateTruck(id: string, formData: FormData) {
  const parsed = truckSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const specs = parseSpecs(formData);

  await prisma.$transaction([
    prisma.specification.deleteMany({ where: { truckId: id } }),
    prisma.truck.update({
      where: { id },
      data: {
        ...parsed.data,
        specifications: { create: specs.map((s, i) => ({ ...s, sortOrder: i })) },
      },
    }),
  ]);

  await addTruckImages(id, formData);

  revalidatePath("/admin/trucks");
  redirect("/admin/trucks");
}

export async function archiveTruck(id: string) {
  await prisma.truck.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/admin/trucks");
}
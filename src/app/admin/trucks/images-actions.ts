"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { saveTruckImage } from "@/lib/storage/local";

export async function addTruckImages(truckId: string, formData: FormData) {
  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return;

  const existingCount = await prisma.truckImage.count({ where: { truckId } });

  const data: {
    truckId: string;
    url: string;
    alt: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];

  for (const file of files) {
    try {
      const url = await saveTruckImage(file);
      data.push({
        truckId,
        url,
        alt: "",
        sortOrder: existingCount + data.length,
        isPrimary: existingCount === 0 && data.length === 0,
      });
    } catch {
      // skip files that fail validation (wrong type / too large) —
      // the rest of the batch still saves
    }
  }

  if (data.length > 0) {
    await prisma.truckImage.createMany({ data });
  }

  revalidatePath(`/admin/trucks/${truckId}/edit`);
  revalidatePath("/admin/trucks");
}

export async function deleteTruckImage(truckId: string, imageId: string) {
  const image = await prisma.truckImage.findUnique({ where: { id: imageId } });
  if (!image || image.truckId !== truckId) return;

  await prisma.truckImage.delete({ where: { id: imageId } });

  if (image.isPrimary) {
    const next = await prisma.truckImage.findFirst({
      where: { truckId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.truckImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  revalidatePath(`/admin/trucks/${truckId}/edit`);
  revalidatePath("/admin/trucks");
}

export async function setPrimaryTruckImage(truckId: string, imageId: string) {
  await prisma.$transaction([
    prisma.truckImage.updateMany({ where: { truckId }, data: { isPrimary: false } }),
    prisma.truckImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);

  revalidatePath(`/admin/trucks/${truckId}/edit`);
  revalidatePath("/admin/trucks");
}
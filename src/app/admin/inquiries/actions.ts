"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import type { InquiryStatus } from "@prisma/client";

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await prisma.inquiry.update({ where: { id }, data: { status } });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}
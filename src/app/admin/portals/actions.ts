"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { deletePortalFile } from "@/lib/portal/storage";

export async function deletePortal(id: string) {
  const store = await cookies();
  if (!(await verifySession(store.get(COOKIE_NAME)?.value))) return;

  const portal = await prisma.portal.findUnique({
    where: { id },
    include: { documents: { select: { storedName: true } } },
  });
  if (!portal) return;

  await prisma.portal.delete({ where: { id } }); // cascades steps/charges/documents
  await Promise.all(
    portal.documents.filter((d) => d.storedName).map((d) => deletePortalFile(d.storedName!))
  );
  revalidatePath("/admin/portals");
}

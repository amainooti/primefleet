import { prisma } from "@/lib/db/client";
import { keyMatches } from "./keys";

export async function loadPortal(slug: string) {
  return prisma.portal.findUnique({
    where: { slug },
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      charges: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
}

/** Loads the portal and returns it only if `key` is the correct manage key. */
export async function loadPortalForManage(slug: string, key: string | undefined | null) {
  const portal = await loadPortal(slug);
  if (!portal || !keyMatches(key, portal.manageKeyHash)) return null;
  return portal;
}

export function portalPaths(slug: string, key?: string) {
  const view = `/portal/${slug}`;
  const manage = key ? `${view}?key=${encodeURIComponent(key)}` : view;
  return { view, manage };
}

import { prisma } from "@/lib/db/client";
import { readPortalFile } from "@/lib/portal/storage";

export const dynamic = "force-dynamic";

const INLINE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; docId: string }> }
) {
  const { slug, docId } = await params;

  const doc = await prisma.portalDocument.findFirst({
    where: { id: docId, portal: { slug } },
  });
  if (!doc) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readPortalFile(doc.storedName);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  const disposition = !wantsDownload && INLINE_TYPES.has(doc.mimeType) ? "inline" : "attachment";
  const asciiName = doc.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

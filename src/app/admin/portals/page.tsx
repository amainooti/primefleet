import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { deletePortal } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPortalsPage() {
  const portals = await prisma.portal.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#141414]">Client portals</h1>
          <p className="text-sm text-[#6B6E76]">
            Portals created from the public <code>/portal/new</code> link.
          </p>
        </div>
        <Link
          href="/portal/new"
          target="_blank"
          className="flex items-center gap-1.5 rounded bg-[#141414] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37] hover:opacity-90"
        >
          <ExternalLink size={16} /> Public create link
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#e4e4e2] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e4e4e2] bg-[#fafaf9] text-xs uppercase tracking-wide text-[#6B6E76]">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Docs</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee]">
            {portals.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#141414]">{p.contactName}</p>
                  <p className="text-xs text-[#6B6E76]">
                    {p.companyName}
                    {p.contactEmail ? ` · ${p.contactEmail}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3">{p.vehicleTitle}</td>
                <td className="px-4 py-3">{p._count.documents}</td>
                <td className="px-4 py-3 text-[#6B6E76]">
                  {p.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/portal/${p.slug}`}
                      target="_blank"
                      className="text-xs font-semibold text-[#141414] underline"
                    >
                      Open
                    </Link>
                    <form action={deletePortal.bind(null, p.id)}>
                      <button
                        className="rounded p-1.5 text-[#6B6E76] hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete portal for ${p.contactName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {portals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#6B6E76]">
                  No portals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

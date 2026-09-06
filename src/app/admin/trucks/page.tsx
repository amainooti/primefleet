import Link from "next/link";
import { Plus, Search, Pencil, Archive, ArchiveRestore, Package } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { archiveTruck, restoreTruck } from "./actions";
import type { TruckStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<TruckStatus, string> = {
  AVAILABLE: "bg-[#141414] text-[#D4AF37]",
  RESERVED: "bg-amber-100 text-amber-800",
  RENTED: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  ARCHIVED: "bg-[#E4E4E2] text-[#6B6E76]",
};

const FILTERS: { label: string; value?: TruckStatus | "ALL" }[] = [
  { label: "All active", value: "ALL" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Rented", value: "RENTED" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Archived", value: "ARCHIVED" },
];

export default async function AdminTrucksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const validStatus = FILTERS.some((f) => f.value === status)
    ? (status as TruckStatus | "ALL")
    : "ALL";

  const statusFilter =
    validStatus === "ALL"
      ? { not: "ARCHIVED" as TruckStatus }
      : validStatus;

  const trucks = await prisma.truck.findMany({
    where: {
      status: statusFilter,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { manufacturer: { contains: q, mode: "insensitive" } },
              { stockNumber: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#141414]">Inventory</h1>
        <Link
          href="/admin/trucks/new"
          className="flex items-center gap-1.5 rounded bg-[#141414] px-4 py-2 text-sm font-semibold text-[#D4AF37] transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> Add Truck
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={
                f.value === "ALL"
                  ? `/admin/trucks${q ? `?q=${q}` : ""}`
                  : `/admin/trucks?status=${f.value}${q ? `&q=${q}` : ""}`
              }
              className={
                "rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wide " +
                (validStatus === f.value
                  ? "bg-[#141414] text-[#D4AF37]"
                  : "bg-[#E4E4E2] text-[#6B6E76] hover:opacity-80")
              }
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form className="relative w-full max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6E76]"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search inventory..."
            className="w-full rounded border border-[#E4E4E2] py-2 pl-9 pr-3 text-sm"
          />
        </form>
      </div>

      {trucks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[#E4E4E2] p-12 text-center text-sm text-[#6B6E76]">
          <Package size={28} className="text-[#D4AF37]" />
          No trucks match this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E4E4E2] bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E4E4E2] text-xs font-semibold uppercase tracking-wide text-[#6B6E76]">
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E2]">
              {trucks.map((t) => (
                <tr key={t.id} className="text-sm text-[#141414]">
                  <td className="px-4 py-3 font-mono text-xs text-[#6B6E76]">
                    {t.stockNumber}
                  </td>
                  <td className="px-4 py-3 font-semibold">{t.title}</td>
                  <td className="px-4 py-3 text-[#6B6E76]">{t.category.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-sm px-2 py-0.5 text-xs font-semibold " +
                        STATUS_STYLES[t.status]
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/trucks/${t.id}/edit`}
                        className="flex items-center gap-1 text-[#6B6E76] hover:text-[#141414]"
                      >
                        <Pencil size={14} /> Edit
                      </Link>
                      {t.status === "ARCHIVED" ? (
                        <form action={restoreTruck.bind(null, t.id)}>
                          <button
                            type="submit"
                            className="flex items-center gap-1 text-[#6B6E76] hover:text-emerald-700"
                          >
                            <ArchiveRestore size={14} /> Restore
                          </button>
                        </form>
                      ) : (
                        <form action={archiveTruck.bind(null, t.id)}>
                          <button
                            type="submit"
                            className="flex items-center gap-1 text-[#6B6E76] hover:text-red-700"
                          >
                            <Archive size={14} /> Archive
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
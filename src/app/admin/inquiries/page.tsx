import Link from "next/link";
import { prisma } from "@/lib/db/client";
import type { InquiryStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-[#141414] text-[#D4AF37]",
  CONTACTED: "bg-[#E4E4E2] text-[#6B6E76]",
  CLOSED: "bg-[#E4E4E2] text-[#6B6E76]",
};

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus =
    status === "NEW" || status === "CONTACTED" || status === "CLOSED"
      ? status
      : undefined;

  const inquiries = await prisma.inquiry.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: { truck: { select: { title: true, stockNumber: true } } },
  });

  const filters: { label: string; value?: InquiryStatus }[] = [
    { label: "All" },
    { label: "New", value: "NEW" },
    { label: "Contacted", value: "CONTACTED" },
    { label: "Closed", value: "CLOSED" },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#141414]">Inquiries</h1>
      </div>

      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/inquiries?status=${f.value}` : "/admin/inquiries"}
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

      {inquiries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#E4E4E2] p-6 text-sm text-[#6B6E76]">
          No inquiries found.
        </p>
      ) : (
        <div className="divide-y divide-[#E4E4E2] rounded-lg border border-[#E4E4E2] bg-white">
          {inquiries.map((inq) => (
            <Link
              key={inq.id}
              href={`/admin/inquiries/${inq.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#FAFAF9]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#141414]">{inq.name}</p>
                <p className="truncate text-sm text-[#6B6E76]">
                  {inq.truck
                    ? `${inq.truck.title} (#${inq.truck.stockNumber})`
                    : "General inquiry"}{" "}
                  · {inq.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-[#6B6E76]">
                  {inq.createdAt.toLocaleDateString()}
                </span>
                <span
                  className={
                    "rounded-sm px-2 py-0.5 text-xs font-semibold " +
                    STATUS_STYLES[inq.status]
                  }
                >
                  {inq.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
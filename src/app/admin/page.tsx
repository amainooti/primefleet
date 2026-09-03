import Link from "next/link";
import { prisma } from "@/lib/db/client";

export default async function AdminDashboard() {
  const [statusCounts, newInquiryCount, recentInquiries] = await Promise.all([
    prisma.truck.groupBy({ by: ["status"], _count: true }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { truck: { select: { title: true, stockNumber: true } } },
    }),
  ]);

  const countFor = (status: string) =>
    statusCounts.find((s) => s.status === status)?._count ?? 0;

  const totalActive = statusCounts
    .filter((s) => s.status !== "ARCHIVED")
    .reduce((sum, s) => sum + s._count, 0);

  const stats = [
    { label: "Active listings", value: totalActive },
    { label: "Available", value: countFor("AVAILABLE") },
    { label: "Reserved", value: countFor("RESERVED") },
    { label: "Rented", value: countFor("RENTED") },
    { label: "In maintenance", value: countFor("MAINTENANCE") },
    { label: "New inquiries", value: newInquiryCount },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#141414]">Dashboard</h1>
          <p className="text-sm text-[#6B6E76]">
            Overview of your inventory and inquiries.
          </p>
        </div>
        <Link
          href="/admin/trucks/new"
          className="rounded bg-[#141414] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37] transition-opacity hover:opacity-90"
        >
          + Add Truck
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-[#E4E4E2] bg-white p-4"
          >
            <p className="text-2xl font-bold text-[#141414]">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6E76]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#141414]">
              Recent inquiries
            </h2>
          </div>

          {recentInquiries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E4E4E2] p-6 text-sm text-[#6B6E76]">
              No inquiries yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E4E4E2] rounded-lg border border-[#E4E4E2] bg-white">
              {recentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#141414]">
                      {inq.name}
                    </p>
                    <p className="truncate text-sm text-[#6B6E76]">
                      {inq.truck
                        ? `${inq.truck.title} (#${inq.truck.stockNumber})`
                        : "General inquiry"}{" "}
                      · {inq.email}
                    </p>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-sm px-2 py-0.5 text-xs font-semibold " +
                      (inq.status === "NEW"
                        ? "bg-[#141414] text-[#D4AF37]"
                        : "bg-[#E4E4E2] text-[#6B6E76]")
                    }
                  >
                    {inq.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-[#141414]">
            Quick links
          </h2>
          <div className="space-y-2">
            <Link
              href="/admin/trucks"
              className="block rounded-lg border border-[#E4E4E2] bg-white px-4 py-3 text-sm font-semibold text-[#141414] transition-colors hover:border-[#D4AF37]"
            >
              View inventory
            </Link>
            <Link
              href="/admin/trucks/new"
              className="block rounded-lg border border-[#E4E4E2] bg-white px-4 py-3 text-sm font-semibold text-[#141414] transition-colors hover:border-[#D4AF37]"
            >
              Add a truck
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";
import {
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Wrench,
  MessageSquare,
  Package,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

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
    { label: "Active listings", value: totalActive, icon: Package },
    { label: "Available", value: countFor("AVAILABLE"), icon: CheckCircle2 },
    { label: "Reserved", value: countFor("RESERVED"), icon: Clock },
    { label: "Rented", value: countFor("RENTED"), icon: Truck },
    { label: "In maintenance", value: countFor("MAINTENANCE"), icon: Wrench },
    { label: "New inquiries", value: newInquiryCount, icon: MessageSquare },
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
          className="flex items-center gap-1.5 rounded bg-[#141414] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37] transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> Add Truck
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-[#E4E4E2] bg-white p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-2xl font-bold text-[#141414]">{s.value}</p>
              <s.icon size={18} className="text-[#D4AF37]" />
            </div>
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
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-1 text-sm font-semibold text-[#6B6E76] hover:text-[#141414]"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E4E4E2] p-6 text-sm text-[#6B6E76]">
              No inquiries yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E4E4E2] rounded-lg border border-[#E4E4E2] bg-white">
              {recentInquiries.map((inq) => (
                <Link
                  href={`/admin/inquiries/${inq.id}`}
                  key={inq.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#FAFAF9]"
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
                </Link>
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
              className="flex items-center gap-2 rounded-lg border border-[#E4E4E2] bg-white px-4 py-3 text-sm font-semibold text-[#141414] transition-colors hover:border-[#D4AF37]"
            >
              <Truck size={16} className="text-[#D4AF37]" /> View inventory
            </Link>
            <Link
              href="/admin/trucks/new"
              className="flex items-center gap-2 rounded-lg border border-[#E4E4E2] bg-white px-4 py-3 text-sm font-semibold text-[#141414] transition-colors hover:border-[#D4AF37]"
            >
              <Plus size={16} className="text-[#D4AF37]" /> Add a truck
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-2 rounded-lg border border-[#E4E4E2] bg-white px-4 py-3 text-sm font-semibold text-[#141414] transition-colors hover:border-[#D4AF37]"
            >
              <MessageSquare size={16} className="text-[#D4AF37]" /> View inquiries
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
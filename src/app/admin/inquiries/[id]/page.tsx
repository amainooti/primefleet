import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { updateInquiryStatus } from "../actions";
import { StatusSelect } from "./StatusSelect";

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: { truck: { select: { id: true, title: true, stockNumber: true, slug: true } } },
  });

  if (!inquiry) notFound();

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/admin/inquiries" className="text-sm text-[#6B6E76] hover:underline">
        ← Back to inquiries
      </Link>

      <div className="mt-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#141414]">{inquiry.name}</h1>
        <StatusSelect id={id} status={inquiry.status} />
      </div>

      <div className="rounded-lg border border-[#E4E4E2] bg-white p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6E76]">Contact</p>
          <p className="text-[#141414]">{inquiry.email}</p>
          {inquiry.phone && <p className="text-[#141414]">{inquiry.phone}</p>}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6E76]">Truck</p>
          {inquiry.truck ? (
            <Link
              href={`/admin/trucks/${inquiry.truck.id}/edit`}
              className="text-[#141414] underline"
            >
              {inquiry.truck.title} (#{inquiry.truck.stockNumber})
            </Link>
          ) : (
            <p className="text-[#141414]">General inquiry</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6E76]">Message</p>
          <p className="whitespace-pre-wrap text-[#141414]">{inquiry.message}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6E76]">Received</p>
          <p className="text-[#141414]">{inquiry.createdAt.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
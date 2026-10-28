import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalForm } from "@/components/portal/PortalForm";
import { loadPortalForManage, portalPaths } from "@/lib/portal/access";
import { updatePortal } from "../../actions";
import {
  ACCEPT_ATTR,
  MAX_DOC_ROWS_PER_REQUEST,
  MAX_FILES_PER_PORTAL,
  MAX_FILES_PER_REQUEST,
} from "@/lib/portal/constants";

export const dynamic = "force-dynamic";

export default async function EditPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;
  const portal = await loadPortalForManage(slug, key);
  if (!portal || !key) notFound();

  const room = Math.max(0, Math.min(MAX_DOC_ROWS_PER_REQUEST, MAX_FILES_PER_PORTAL - portal.documents.length));

  return (
    <main className="min-h-screen bg-[#f4f5fa] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href={portalPaths(slug, key).manage} className="text-sm font-semibold text-[#6B6E76] hover:text-[#141414]">
          ← Back to dashboard
        </Link>
        <h1 className="mb-8 mt-3 text-3xl font-bold text-[#141414]">Edit portal</h1>
        <PortalForm
          action={updatePortal.bind(null, slug, key)}
          initial={{
            contactName: portal.contactName,
            companyName: portal.companyName,
            contactEmail: portal.contactEmail ?? "",
            contactPhone: portal.contactPhone ?? "",
            dealerName: portal.dealerName,
            alertText: portal.alertText ?? "",
            alertActionLabel: portal.alertActionLabel ?? "",
            maintenanceNotes: portal.maintenanceNotes ?? "",
            supportName: portal.supportName ?? "",
            supportEmail: portal.supportEmail ?? "",
            supportPhone: portal.supportPhone ?? "",
            vehicleTitle: portal.vehicleTitle,
            vehicleStatus: portal.vehicleStatus,
            stockNumber: portal.stockNumber ?? "",
            vehicleColor: portal.vehicleColor ?? "",
            vin: portal.vin ?? "",
            engine: portal.engine ?? "",
            transmission: portal.transmission ?? "",
            mileage: portal.mileage ?? "",
            steps: portal.steps.map((s) => ({ label: s.label, status: s.status })),
            charges: portal.charges.map((c) => ({
              label: c.label,
              note: c.note ?? "",
              amount: c.amount,
              suffix: c.suffix ?? "",
              status: c.status ?? "NONE",
            })),
          }}
          submitLabel="Save changes"
          maxNewFiles={room}
          maxFiles={MAX_FILES_PER_REQUEST}
          acceptAttr={ACCEPT_ATTR}
        />
      </div>
    </main>
  );
}

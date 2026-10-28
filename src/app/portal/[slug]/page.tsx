import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  CreditCard,
  ExternalLink,
  FileText,
  Hourglass,
  LayoutDashboard,
  LogOut,
  Circle,
  ClipboardList,
  Mail,
  Pencil,
  Phone,
  Receipt,
  Trash2,
  Truck,
  Wrench,
} from "lucide-react";
import { loadPortal, portalPaths } from "@/lib/portal/access";
import { keyMatches } from "@/lib/portal/keys";
import { ACCEPT_ATTR, formatBytes, formatMoney } from "@/lib/portal/constants";
import { CopyLink } from "@/components/portal/CopyLink";
import { UploadDocForm } from "@/components/portal/UploadDocForm";
import { AttachFileForm } from "@/components/portal/AttachFileForm";
import { attachFile, deleteDocument, setStepStatus, uploadDocument } from "../actions";

export const dynamic = "force-dynamic";

const NAVY = "#0f1024";
const GOLD = "#c9a227";

function docIcon(kind: string) {
  const k = kind.toLowerCase();
  if (/invoice|receipt|deposit|payment/.test(k)) return Receipt;
  if (/inspection|checklist|report/.test(k)) return ClipboardList;
  return FileText;
}

function ext(fileName: string | null) {
  const m = fileName?.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : "FILE";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const CHARGE_CHIP: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-amber-100 text-amber-700",
  DUE: "bg-red-100 text-red-700",
};

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string; created?: string }>;
}) {
  const { slug } = await params;
  const { key, created } = await searchParams;

  const portal = await loadPortal(slug);
  if (!portal) notFound();

  const canManage = keyMatches(key, portal.manageKeyHash);
  const mk = canManage ? key! : "";
  const paths = portalPaths(slug, canManage ? key : undefined);

  const done = portal.steps.filter((s) => s.status === "DONE").length;
  const pct = portal.steps.length ? Math.round((done / portal.steps.length) * 100) : 0;
  const pendingStep = portal.steps.find((s) => s.status === "PENDING");
  const bannerText =
    portal.alertText ?? (pendingStep ? `Action Required: ${pendingStep.label}` : null);

  const hasSupport = !!(portal.supportName || portal.supportEmail || portal.supportPhone);

  const vehicleFacts = [
    ["VIN", portal.vin, true],
    ["Engine", portal.engine, false],
    ["Transmission", portal.transmission, false],
    ["Current mileage", portal.mileage, false],
  ] as const;

  const nav = [
    { href: "#top", label: "Dashboard", icon: LayoutDashboard },
    { href: "#vehicle", label: "My Vehicle", icon: Truck },
    { href: "#billing", label: "Billing & Payments", icon: CreditCard },
    { href: "#documents", label: "Documents", icon: FileText },
    ...(portal.maintenanceNotes
      ? [{ href: "#maintenance", label: "Maintenance", icon: Wrench }]
      : []),
  ];

  const card = "overflow-hidden rounded-lg border border-[#e4e8ef] bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]";
  const cardHead =
    "border-b border-[#e4e8ef] bg-[#fafbfc] px-6 py-5 text-[15px] font-bold uppercase tracking-[0.14em] text-[#12132a]";

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f5fa] lg:flex-row">
      {/* Sidebar */}
      <aside
        className="shrink-0 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col"
        style={{ background: NAVY }}
      >
        <div className="border-b border-white/10 px-6 py-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/4954342108944862507_121-removebg-preview.png"
            alt="Prime Fleet"
            className="mx-auto mb-3 h-10 w-auto"
          />
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#c9a227]">
            Client Portal
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 py-3 lg:flex-1 lg:flex-col lg:py-4">
          {nav.map((n, i) => (
            <a
              key={n.href}
              href={n.href}
              className={`flex shrink-0 items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
                i === 0
                  ? "bg-white/10 text-white lg:border-l-4 lg:border-[#c9a227]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <n.icon size={18} className={i === 0 ? "text-[#c9a227]" : ""} />
              {n.label}
            </a>
          ))}
          {canManage && (
            <Link
              href={paths.view}
              className="flex shrink-0 items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white"
            >
              <LogOut size={18} /> Exit manage mode
            </Link>
          )}
        </nav>
        <p className="hidden border-t border-white/10 px-6 py-5 text-center text-xs text-white/50 lg:block">
          {portal.dealerName}
        </p>
      </aside>

      <main id="top" className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10">
        {/* Manage bar */}
        {canManage && (
          <div className="mb-6 rounded-xl border border-[#c9a227]/50 bg-[#fffaf0] p-4">
            <p className="text-sm font-bold text-[#141414]">
              {created ? "Your portal is ready 🎉" : "Manage mode"}
            </p>
            <p className="mt-1 text-sm text-[#5b5f69]">
              Share the <strong>view link</strong> with anyone — they can look but not change
              anything. Keep the <strong>manage link</strong> (this page&rsquo;s address) private;
              it&rsquo;s the only way to edit or upload, and it can&rsquo;t be recovered.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyLink path={paths.view} label="Copy view link (share this)" />
              <CopyLink path={paths.manage} label="Copy manage link (keep private)" />
              <Link
                href={`/portal/${slug}/edit?key=${encodeURIComponent(mk)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#141414] px-3 py-1.5 text-xs font-semibold text-[#141414] hover:bg-[#141414] hover:text-[#c9a227]"
              >
                <Pencil size={14} /> Edit details
              </Link>
              <Link
                href={paths.view}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#d9dce3] px-3 py-1.5 text-xs font-semibold text-[#141414] hover:bg-white"
              >
                <ExternalLink size={14} /> Preview as visitor
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#12132a]">
              Welcome back, {portal.contactName.split(/\s+/)[0]}
            </h1>
            <p className="mt-1 text-[#5a6270]">
              Here is the current status of your {portal.companyName} fleet allocation.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-6 shadow-sm">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: NAVY }}
            >
              {initials(portal.contactName)}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-[#12132a]">{portal.contactName}</span>
              <span className="block text-sm text-[#5a6270]">{portal.companyName}</span>
            </span>
          </div>
        </header>

        {/* Alert */}
        {bannerText && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-[#c9a227] bg-[#fff8e6] px-5 py-4">
            <p className="text-[15px] font-semibold text-[#141414]">
              {bannerText.startsWith("Action Required") ? bannerText : `Action Required: ${bannerText}`}
            </p>
            {canManage && (
              <a href="#upload" className="text-[15px] font-bold text-[#141414] underline">
                {portal.alertActionLabel || "Upload"} →
              </a>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)]">
          <div className="space-y-6">
            {/* Vehicle */}
            <section id="vehicle" className={`${card} scroll-mt-6`}>
              <div className="flex items-center justify-between border-b border-[#e4e8ef] bg-[#fafbfc] px-6 py-5">
                <h2 className="text-[15px] font-bold uppercase tracking-[0.14em] text-[#12132a]">
                  Assigned Vehicle Allocation
                </h2>
                <span className="rounded bg-green-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-green-700">
                  {portal.vehicleStatus}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-[#12132a]">{portal.vehicleTitle}</h3>
                <p className="mt-1 text-[#5a6270]">
                  {[portal.stockNumber && `Stock #${portal.stockNumber}`, portal.vehicleColor]
                    .filter(Boolean)
                    .join("  |  ")}
                </p>
                <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {vehicleFacts
                    .filter(([, v]) => v)
                    .map(([k, v, mono]) => (
                      <div key={k} className="border-b border-dashed border-[#e4e8ef] pb-3">
                        <dt className="text-xs font-bold uppercase tracking-wider text-[#5a6270]">{k}</dt>
                        <dd className={`mt-1 font-semibold text-[#12132a] ${mono ? "break-all font-mono" : ""}`}>
                          {v}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            </section>

            {/* Billing */}
            <section id="billing" className={`${card} scroll-mt-6`}>
              <h2 className={cardHead}>Financial Breakdown</h2>
              <div className="px-6 py-4">
                {portal.charges.length === 0 && (
                  <p className="py-4 text-sm text-[#5a6270]">No charges listed yet.</p>
                )}
                <ul className="divide-y divide-[#e4e8ef]">
                  {portal.charges.map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-4 py-4">
                      <div>
                        <p className="font-bold text-[#12132a]">{c.label}</p>
                        {c.note && <p className="text-sm text-[#5a6270]">{c.note}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#12132a]">
                          {formatMoney(c.amount)}
                          {c.suffix && <span className="ml-1 text-sm font-bold">{c.suffix}</span>}
                        </p>
                        {c.status && (
                          <span className={`mt-1 inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase ${CHARGE_CHIP[c.status]}`}>
                            {c.status}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {portal.maintenanceNotes && (
              <section id="maintenance" className={`${card} scroll-mt-6`}>
                <h2 className={cardHead}>Maintenance</h2>
                <p className="whitespace-pre-wrap px-6 py-5 text-[#12132a]">{portal.maintenanceNotes}</p>
              </section>
            )}
          </div>

          <div className="space-y-6">
            {/* Onboarding */}
            <section className={card}>
              <h2 className={cardHead}>Onboarding Progress</h2>
              <div className="px-6 py-6">
                <div className="flex items-center justify-between text-sm font-bold text-[#12132a]">
                  <span>Profile Completion</span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e8ef]">
                  <div className="h-full rounded-full bg-[#15803d]" style={{ width: `${pct}%` }} />
                </div>
                <ul className="mt-6 space-y-3.5">
                  {portal.steps.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3">
                      <span
                        className={`flex items-center gap-2 text-[15px] ${
                          s.status === "DONE"
                            ? "font-bold text-[#15803d]"
                            : s.status === "PENDING"
                              ? "font-bold text-[#d97706]"
                              : "text-[#5a6270]"
                        }`}
                      >
                        {s.status === "DONE" ? (
                          <Check size={16} strokeWidth={3} />
                        ) : s.status === "PENDING" ? (
                          <Hourglass size={15} strokeWidth={2.5} />
                        ) : (
                          <Circle size={12} />
                        )}
                        {s.label}
                      </span>
                      {canManage && (
                        <form action={setStepStatus.bind(null, slug, mk, s.id, s.status === "DONE" ? "TODO" : "DONE")}>
                          <button className="text-xs font-semibold text-[#5a6270] underline hover:text-[#12132a]">
                            {s.status === "DONE" ? "Reopen" : "Mark done"}
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                  {portal.steps.length === 0 && (
                    <li className="text-sm text-[#5a6270]">No steps yet.</li>
                  )}
                </ul>
              </div>
            </section>

            {/* Documents */}
            <section id="documents" className={`${card} scroll-mt-6`}>
              <h2 className={cardHead}>My Documents</h2>
              <div className="px-6 py-5">
                {portal.documents.length === 0 ? (
                  <p className="text-sm text-[#5a6270]">No documents uploaded yet.</p>
                ) : (
                  <ul className="divide-y divide-[#e4e8ef]">
                    {portal.documents.map((d) => {
                      const Icon = docIcon(d.kind);
                      const hasFile = !!d.storedName;
                      const sub =
                        d.note ??
                        (hasFile
                          ? `${d.fileName} · ${formatBytes(d.size ?? 0)} · ${d.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}`
                          : "Pending");
                      return (
                        <li key={d.id} className="flex items-center gap-3 py-3">
                          <Icon size={20} className="shrink-0 text-[#2a2d5c]" />
                          <div className="min-w-0 flex-1">
                            {hasFile ? (
                              <a
                                href={`/portal/${slug}/files/${d.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-sm font-bold text-[#12132a] hover:underline"
                              >
                                {d.kind}
                              </a>
                            ) : (
                              <p className="truncate text-sm font-bold text-[#12132a]">{d.kind}</p>
                            )}
                            <p className="truncate text-xs text-[#5a6270]">{sub}</p>
                          </div>
                          {hasFile ? (
                            <a
                              href={`/portal/${slug}/files/${d.id}?download=1`}
                              className="rounded border border-[#e4e8ef] bg-[#f4f6fa] px-3 py-1.5 text-xs font-bold text-[#12132a] hover:bg-[#0f1024] hover:text-white"
                              aria-label={`Download ${d.fileName}`}
                            >
                              {ext(d.fileName)}
                            </a>
                          ) : canManage ? (
                            <AttachFileForm
                              action={attachFile.bind(null, slug, mk, d.id)}
                              acceptAttr={ACCEPT_ATTR}
                            />
                          ) : (
                            <span className="rounded border border-[#e4e8ef] bg-[#f4f6fa] px-3 py-1.5 text-xs font-bold text-[#12132a] opacity-50">
                              PDF
                            </span>
                          )}
                          {canManage && (
                            <form action={deleteDocument.bind(null, slug, mk, d.id)}>
                              <button
                                className="rounded p-1.5 text-[#5a6270] hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${d.kind}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {canManage && (
                  <UploadDocForm
                    key={portal.documents.length}
                    action={uploadDocument.bind(null, slug, mk)}
                    acceptAttr={ACCEPT_ATTR}
                    defaultKind="Certificate of Insurance (COI)"
                  />
                )}
              </div>
            </section>

            {hasSupport && (
              <section className="rounded-lg p-6 text-center text-white" style={{ background: NAVY }}>
                <h2 className="text-lg font-bold" style={{ color: GOLD }}>Need Assistance?</h2>
                <p className="mb-5 mt-2 text-[13px] text-white/80">
                  {portal.supportName
                    ? `Your dedicated account manager, ${portal.supportName}, is available to help.`
                    : "Our team is available to help."}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {portal.supportEmail && (
                    <a
                      href={`mailto:${portal.supportEmail}`}
                      className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-bold text-[#0f1024]"
                      style={{ background: GOLD }}
                    >
                      <Mail size={15} /> Contact Support
                    </a>
                  )}
                  {portal.supportPhone && (
                    <a
                      href={`tel:${portal.supportPhone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-2 rounded border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
                    >
                      <Phone size={15} /> {portal.supportPhone}
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

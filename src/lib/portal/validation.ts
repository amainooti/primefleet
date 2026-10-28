import { z } from "zod";
import { CHARGE_STATUS_OR_NONE, STEP_STATUSES } from "./constants";

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const portalSchema = z.object({
  contactName: z.string().trim().min(1, "Your name is required.").max(80),
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  contactEmail: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email.")
    .transform((v) => (v ? v : undefined)),
  contactPhone: opt(40),
  dealerName: z.string().trim().min(1).max(120),
  alertText: opt(300),
  alertActionLabel: opt(40),
  maintenanceNotes: opt(2000),
  supportName: opt(80),
  supportEmail: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email.")
    .transform((v) => (v ? v : undefined)),
  supportPhone: opt(40),
  vehicleTitle: z.string().trim().min(1, "Vehicle name is required.").max(160),
  vehicleStatus: z.string().trim().min(1).max(60),
  stockNumber: opt(40),
  vehicleColor: opt(80),
  vin: opt(40),
  engine: opt(80),
  transmission: opt(80),
  mileage: opt(40),
});

export const stepSchema = z.object({
  label: z.string().trim().min(1).max(120),
  status: z.enum(STEP_STATUSES),
});

export const chargeSchema = z.object({
  label: z.string().trim().min(1).max(120),
  note: opt(160),
  amount: z.string().trim().min(1).max(30),
  suffix: opt(20),
  status: z.enum(CHARGE_STATUS_OR_NONE).transform((v) => (v === "NONE" ? null : v)),
});

const TEXT_FIELDS: string[] = Object.keys(portalSchema.shape);

export function parsePortalForm(fd: FormData) {
  const raw: Record<string, string | undefined> = {};
  for (const f of TEXT_FIELDS) {
    const v = fd.get(f);
    raw[f] = typeof v === "string" ? v : undefined;
  }
  const base = portalSchema.safeParse(raw);

  const str = (name: string) => fd.getAll(name).map((v) => (typeof v === "string" ? v : ""));
  const stepLabels = str("step_label");
  const stepStatuses = str("step_status");
  const steps = stepLabels
    .map((label, i) => ({ label, status: stepStatuses[i] }))
    .filter((s) => s.label.trim())
    .slice(0, 12)
    .map((s) => stepSchema.safeParse(s));

  const cLabels = str("charge_label");
  const cNotes = str("charge_note");
  const cAmounts = str("charge_amount");
  const cSuffixes = str("charge_suffix");
  const cStatuses = str("charge_status");
  const charges = cLabels
    .map((label, i) => ({
      label,
      note: cNotes[i],
      amount: cAmounts[i],
      suffix: cSuffixes[i],
      status: cStatuses[i] || "NONE",
    }))
    .filter((c) => c.label.trim() || c.amount.trim())
    .slice(0, 12)
    .map((c) => chargeSchema.safeParse(c));

  const fieldErrors: Record<string, string> = {};
  if (!base.success) {
    for (const issue of base.error.issues) {
      const k = String(issue.path[0]);
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
  }
  if (steps.some((s) => !s.success))
    fieldErrors.steps = "Each onboarding step needs a name.";
  if (charges.some((c) => !c.success))
    fieldErrors.charges = "Each charge needs a label and an amount.";

  if (!base.success || Object.keys(fieldErrors).length) {
    return { ok: false as const, fieldErrors };
  }
  return {
    ok: true as const,
    data: base.data,
    steps: steps.map((s) => (s as { data: z.infer<typeof stepSchema> }).data),
    charges: charges.map((c) => (c as { data: z.infer<typeof chargeSchema> }).data),
  };
}

export type UploadRow = { kind: string; note?: string; file: File | null };

/**
 * One row per listed document. A row with a file is uploaded; a row with only a
 * title becomes a "listed" document (shown disabled until a file is attached).
 */
export function collectUploads(fd: FormData): UploadRow[] {
  const strs = (name: string) =>
    fd.getAll(name).map((v) => (typeof v === "string" ? v.trim() : ""));
  const kinds = strs("doc_kind");
  const notes = strs("doc_note");
  const files = fd.getAll("doc_file");
  const rows: UploadRow[] = [];
  const n = Math.max(kinds.length, files.length);
  for (let i = 0; i < n; i++) {
    const f = files[i];
    const file = f instanceof File && f.size > 0 ? f : null;
    const kind = kinds[i] ?? "";
    if (!file && !kind) continue;
    rows.push({
      kind: (kind || file!.name.replace(/\.[^.]+$/, "") || "Document").slice(0, 80),
      note: notes[i] ? notes[i].slice(0, 120) : undefined,
      file,
    });
  }
  return rows;
}

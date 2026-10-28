export const DOCUMENT_KINDS = [
  "Certificate of Insurance (COI)",
  "Lease Agreement",
  "Holding Deposit Receipt",
  "IRP Registration",
  "Driver's License",
  "Other",
] as const;

export const DEFAULT_STEPS = [
  { label: "Holding Deposit Initiated", status: "DONE" },
  { label: "Lease Agreement Signed", status: "DONE" },
  { label: "Pending Insurance (COI)", status: "PENDING" },
  { label: "IRP Reactivation", status: "TODO" },
  { label: "Final Yard Pickup", status: "TODO" },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB each
export const MAX_FILES_PER_REQUEST = 4; // actual files per submit (keeps body under the limit)
export const MAX_FILES_PER_PORTAL = 25;
export const MAX_DOC_ROWS_PER_REQUEST = 12; // listed documents per submit (files optional)
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.webp,.docx";

export const STEP_STATUSES = ["DONE", "PENDING", "TODO"] as const;
export const CHARGE_STATUSES = ["PAID", "PROCESSING", "DUE"] as const;
export const CHARGE_STATUS_OR_NONE = [...CHARGE_STATUSES, "NONE"] as const;

export function formatMoney(raw: string) {
  const n = Number(raw.replace(/[$,\s]/g, ""));
  if (!raw.trim() || Number.isNaN(n)) return raw;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

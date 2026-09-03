const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  RENTED: "Rented",
  MAINTENANCE: "In maintenance",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: string }) {
  const isAvailable = status === "AVAILABLE";

  return (
    <span
      className={
        "inline-block shrink-0 rounded-sm px-2 py-0.5 text-xs font-semibold " +
        (isAvailable
          ? "bg-[#141414] text-[#D4AF37]"
          : "bg-[#E4E4E2] text-[#6B6E76]")
      }
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
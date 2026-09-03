type TruckType =
  | "sleeper" | "daycab" | "flatbed" | "box"
  | "dryvan" | "dump" | "lowboy" | "tank" | "default";

export function iconForSlug(slug: string): TruckType {
  const s = slug.toLowerCase();
  if (s.includes("sleeper")) return "sleeper";
  if (s.includes("day-cab") || s.includes("daycab")) return "daycab";
  if (s.includes("flatbed")) return "flatbed";
  if (s.includes("box")) return "box";
  if (s.includes("dry-van") || s.includes("van")) return "dryvan";
  if (s.includes("dump")) return "dump";
  if (s.includes("lowboy") || s.includes("drop-deck")) return "lowboy";
  if (s.includes("tank")) return "tank";
  return "default";
}

function Wheels({ cx1, cx2, cy }: { cx1: number; cx2: number; cy: number }) {
  return (
    <>
      <circle cx={cx1} cy={cy} r={3.4} fill="none" stroke="currentColor" strokeWidth={1.6} />
      <circle cx={cx2} cy={cy} r={3.4} fill="none" stroke="currentColor" strokeWidth={1.6} />
    </>
  );
}

export function TruckIcon({ type, className }: { type: TruckType; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden="true">
      <line x1={2} y1={26} x2={62} y2={26} stroke="currentColor" strokeWidth={1.2} opacity={0.35} />

      {type === "sleeper" && (
        <>
          <path d="M4 26V14a2 2 0 0 1 2-2h9l6-6h5v8h4l7 6h11a2 2 0 0 1 2 2v4" {...common} />
          <Wheels cx1={14} cx2={22} cy={26.5} />
          <Wheels cx1={44} cx2={53} cy={26.5} />
        </>
      )}
      {type === "daycab" && (
        <>
          <path d="M4 26V16a2 2 0 0 1 2-2h8l6-6h4v8h6l7 4h11a2 2 0 0 1 2 2v4" {...common} />
          <Wheels cx1={13} cx2={21} cy={26.5} />
          <Wheels cx1={44} cx2={53} cy={26.5} />
        </>
      )}
      {(type === "flatbed" || type === "lowboy") && (
        <>
          <path d="M4 26V16a2 2 0 0 1 2-2h8l5-6h4v8h5" {...common} />
          <path d={type === "lowboy" ? "M28 20h32v6H28z" : "M28 18h32v8H28z"} {...common} />
          <Wheels cx1={12} cx2={20} cy={26.5} />
          <Wheels cx1={44} cx2={53} cy={26.5} />
        </>
      )}
      {(type === "box" || type === "dryvan" || type === "default") && (
        <>
          <path d="M4 26V12a2 2 0 0 1 2-2h34a2 2 0 0 1 2 2v14" {...common} />
          <path d="M12 26V18h4l4-6h6" {...common} />
          <Wheels cx1={14} cx2={22} cy={26.5} />
          <Wheels cx1={40} cx2={48} cy={26.5} />
        </>
      )}
      {type === "dump" && (
        <>
          <path d="M4 26V16a2 2 0 0 1 2-2h8l5-6h4v8h5" {...common} />
          <path d="M28 12h20l8 8v6H28z" {...common} />
          <Wheels cx1={12} cx2={20} cy={26.5} />
          <Wheels cx1={44} cx2={53} cy={26.5} />
        </>
      )}
      {type === "tank" && (
        <>
          <path d="M4 26V16a2 2 0 0 1 2-2h8l5-6h4v8h5" {...common} />
          <rect x={28} y={14} width={30} height={12} rx={6} {...common} />
          <Wheels cx1={12} cx2={20} cy={26.5} />
          <Wheels cx1={44} cx2={53} cy={26.5} />
        </>
      )}
    </svg>
  );
}
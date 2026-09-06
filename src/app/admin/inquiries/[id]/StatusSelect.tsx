"use client";

import { updateInquiryStatus } from "../actions";
import type { InquiryStatus } from "@prisma/client";

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  return (
    <select
      defaultValue={status}
      onChange={(e) => updateInquiryStatus(id, e.target.value as InquiryStatus)}
      className="rounded border border-[#E4E4E2] px-3 py-1.5 text-sm font-semibold"
    >
      <option value="NEW">New</option>
      <option value="CONTACTED">Contacted</option>
      <option value="CLOSED">Closed</option>
    </select>
  );
}
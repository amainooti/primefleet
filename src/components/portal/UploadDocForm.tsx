"use client";

import { useActionState, startTransition } from "react";
import { Upload } from "lucide-react";
import type { PortalFormState } from "@/app/portal/actions";
import { DOCUMENT_KINDS } from "@/lib/portal/constants";

export function UploadDocForm({
  action,
  acceptAttr,
  defaultKind,
}: {
  action: (prev: PortalFormState, fd: FormData) => Promise<PortalFormState>;
  acceptAttr: string;
  defaultKind?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as PortalFormState);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // The parent keys this form by document count, so it remounts clean after a successful upload.
    startTransition(() => formAction(fd));
  }

  return (
    <form id="upload" onSubmit={onSubmit} className="mt-5 space-y-3 border-t border-[#eceef3] pt-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[#64708a]">Upload a document</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="doc_kind" defaultValue={defaultKind} className="rounded-md border border-[#d9dce3] bg-white px-3 py-2 text-sm sm:w-64">
          {DOCUMENT_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <input type="file" name="doc_file" accept={acceptAttr} required className="min-w-0 flex-1 rounded-md border border-[#d9dce3] bg-white px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#0f1729] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#D4AF37]" />
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0f1729] px-4 py-2 text-sm font-semibold text-[#D4AF37] disabled:opacity-60">
          <Upload size={15} /> {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

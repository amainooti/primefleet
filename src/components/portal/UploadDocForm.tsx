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

  const field = "rounded-md border border-[#d9dce3] bg-white px-3 py-2 text-sm";

  return (
    <form id="upload" onSubmit={onSubmit} className="mt-5 space-y-3 border-t border-[#e4e8ef] pt-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[#5a6270]">Add a document</p>
      <datalist id="doc-kinds-dash">
        {DOCUMENT_KINDS.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="doc_kind" list="doc-kinds-dash" defaultValue={defaultKind} placeholder="Document name" className={field} aria-label="Document name" />
        <input name="doc_note" placeholder="Note (optional)" className={field} aria-label="Note" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="file" name="doc_file" accept={acceptAttr} className="min-w-0 flex-1 rounded-md border border-[#d9dce3] bg-white px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#0f1024] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#c9a227]" aria-label="File (optional — leave empty to list it as pending)" />
        <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0f1024] px-4 py-2 text-sm font-semibold text-[#c9a227] disabled:opacity-60">
          <Upload size={15} /> {pending ? "Saving…" : "Add"}
        </button>
      </div>
      <p className="text-xs text-[#5a6270]">Leave the file empty to list the document as pending and attach it later.</p>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

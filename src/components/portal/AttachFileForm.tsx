"use client";

import { useActionState, startTransition } from "react";
import type { PortalFormState } from "@/app/portal/actions";

/** Inline "attach a file" control for a listed (pending) document. Submits as soon as a file is chosen. */
export function AttachFileForm({
  action,
  acceptAttr,
}: {
  action: (prev: PortalFormState, fd: FormData) => Promise<PortalFormState>;
  acceptAttr: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as PortalFormState);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const fd = new FormData();
    fd.set("doc_file", e.target.files[0]);
    startTransition(() => formAction(fd));
  }

  return (
    <div className="text-right">
      <label className="cursor-pointer rounded border border-[#e4e8ef] bg-[#f4f6fa] px-3 py-1.5 text-xs font-bold text-[#0f1024] hover:bg-[#0f1024] hover:text-white">
        {pending ? "Uploading…" : "Upload"}
        <input type="file" accept={acceptAttr} onChange={onChange} disabled={pending} className="sr-only" />
      </label>
      {state.error && <p role="alert" className="mt-1 max-w-48 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}

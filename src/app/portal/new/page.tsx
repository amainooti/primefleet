import { PortalForm } from "@/components/portal/PortalForm";
import { EMPTY_PORTAL_VALUES } from "@/components/portal/types";
import { createPortal } from "../actions";
import { ACCEPT_ATTR, MAX_FILES_PER_REQUEST } from "@/lib/portal/storage";

export default function NewPortalPage() {
  return (
    <main className="min-h-screen bg-[#f4f5fa] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Prime Fleet · Client Portal</p>
        <h1 className="mt-2 text-3xl font-bold text-[#141414]">Create your client portal</h1>
        <p className="mb-8 mt-2 text-[#6B6E76]">
          Fill in the details below to build your own fleet-allocation dashboard. When you&rsquo;re
          done you&rsquo;ll get a link you can share with anyone, plus a private link to manage it.
        </p>
        <PortalForm
          action={createPortal}
          initial={EMPTY_PORTAL_VALUES}
          submitLabel="Create portal"
          maxNewFiles={MAX_FILES_PER_REQUEST}
          acceptAttr={ACCEPT_ATTR}
        />
      </div>
    </main>
  );
}

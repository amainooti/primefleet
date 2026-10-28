"use client";

import { useActionState, startTransition, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { PortalFormState } from "@/app/portal/actions";
import { DOCUMENT_KINDS, MAX_FILE_SIZE, MAX_STEPS, STEP_PRESETS } from "@/lib/portal/constants";
import type { PortalFormValues } from "./types";

type Props = {
  action: (prev: PortalFormState, fd: FormData) => Promise<PortalFormState>;
  initial: PortalFormValues;
  submitLabel: string;
  maxNewFiles: number; // max document rows
  maxFiles: number; // max actual files per submit
  acceptAttr: string;
};

const input =
  "w-full rounded-md border border-[#d9dce3] bg-white px-3 py-2 text-sm text-[#141414] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30";
const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6B6E76]";

function Field({
  name,
  title,
  defaultValue,
  error,
  required,
  placeholder,
  type = "text",
  hint,
}: {
  name: string;
  title: string;
  defaultValue: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={label}>
        {title}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={input}
        aria-invalid={error ? true : undefined}
      />
      {hint && !error && <p className="mt-1 text-xs text-[#6B6E76]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e4e4e2] bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#141414]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#6B6E76]">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

let rowId = 0;
const nextId = () => ++rowId;

const STEP_STATUS_LABEL: Record<string, string> = {
  DONE: "Done",
  PENDING: "Pending",
  TODO: "Not started",
};
const norm = (v: string) => v.trim().toLowerCase();

export function PortalForm({ action, initial, submitLabel, maxNewFiles, maxFiles, acceptAttr }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as PortalFormState);
  const fe = state.fieldErrors ?? {};

  const [steps, setSteps] = useState(() =>
    initial.steps.map((s) => ({ ...s, id: nextId() }))
  );
  const [charges, setCharges] = useState(() =>
    initial.charges.map((c) => ({ ...c, id: nextId() }))
  );
  const [docs, setDocs] = useState<{ id: number }[]>([]);

  const doneCount = steps.filter((s) => s.status === "DONE").length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  function updateStep(id: number, patch: Partial<{ label: string; status: string }>) {
    setSteps((x) => x.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addPreset(label: string, status: string) {
    setSteps((x) =>
      x.length >= MAX_STEPS || x.some((r) => norm(r.label) === norm(label))
        ? x
        : [...x, { id: nextId(), label, status }]
    );
  }
  function addAllPresets() {
    setSteps((x) => {
      const next = [...x];
      for (const p of STEP_PRESETS) {
        if (next.length >= MAX_STEPS) break;
        if (!next.some((r) => norm(r.label) === norm(p.label)))
          next.push({ id: nextId(), label: p.label, status: p.status });
      }
      return next;
    });
  }

  // Submit through startTransition (rather than <form action>) so React does not
  // reset the form — typed values and chosen files survive a validation error.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* honeypot — hidden from people, bots fill it */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Section title="Client details" description="Who this portal is for.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="contactName" title="Contact name" required defaultValue={initial.contactName} error={fe.contactName} placeholder="Marilyn Bail" />
          <Field name="companyName" title="Company" required defaultValue={initial.companyName} error={fe.companyName} placeholder="MR1 Enterprises Inc." />
          <Field name="contactEmail" title="Email" type="email" defaultValue={initial.contactEmail} error={fe.contactEmail} />
          <Field name="contactPhone" title="Phone" defaultValue={initial.contactPhone} error={fe.contactPhone} />
        </div>
      </Section>

      <Section title="Assigned vehicle">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field name="vehicleTitle" title="Vehicle" required defaultValue={initial.vehicleTitle} error={fe.vehicleTitle} placeholder="2019 Peterbilt 389 Extended Hood" />
          </div>
          <Field name="vehicleStatus" title="Status badge" defaultValue={initial.vehicleStatus} error={fe.vehicleStatus} />
          <Field name="stockNumber" title="Stock #" defaultValue={initial.stockNumber} error={fe.stockNumber} placeholder="29432" />
          <Field name="vehicleColor" title="Color / type" defaultValue={initial.vehicleColor} error={fe.vehicleColor} placeholder="Polished Black Conventional" />
          <Field name="vin" title="VIN" defaultValue={initial.vin} error={fe.vin} />
          <Field name="engine" title="Engine" defaultValue={initial.engine} error={fe.engine} placeholder="Cummins ISX15 (500 HP)" />
          <Field name="transmission" title="Transmission" defaultValue={initial.transmission} error={fe.transmission} placeholder="Eaton-Fuller 13-Speed" />
          <Field name="mileage" title="Current mileage" defaultValue={initial.mileage} error={fe.mileage} placeholder="494,000 mi" />
        </div>
      </Section>

      <Section
        title="Onboarding progress"
        description="The milestones your client sees on the dashboard. Pick from the standard steps below or add your own, then set each one to Done, Pending or Not started. The progress bar = Done steps ÷ all steps."
      >
        <datalist id="step-presets">
          {STEP_PRESETS.map((p) => (
            <option key={p.label} value={p.label} />
          ))}
        </datalist>

        {/* Quick add: the standard steps, one click each */}
        <div>
          <p className={label}>Standard steps — tap to add</p>
          <div className="flex flex-wrap gap-2">
            {STEP_PRESETS.map((p) => {
              const added = steps.some((s) => norm(s.label) === norm(p.label));
              const full = steps.length >= MAX_STEPS;
              return (
                <button
                  key={p.label}
                  type="button"
                  disabled={added || full}
                  onClick={() => addPreset(p.label, p.status)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    added
                      ? "cursor-default border-green-200 bg-green-50 text-green-700"
                      : "border-[#d9dce3] bg-white text-[#141414] hover:border-[#D4AF37] hover:bg-[#fffaf0] disabled:opacity-50"
                  }`}
                >
                  {added ? <Check size={13} strokeWidth={3} /> : <Plus size={13} />}
                  {p.label}
                </button>
              );
            })}
          </div>
          {STEP_PRESETS.some((p) => !steps.some((s) => norm(s.label) === norm(p.label))) && (
            <button
              type="button"
              onClick={addAllPresets}
              className="mt-2 text-xs font-semibold text-[#6B6E76] underline hover:text-[#141414]"
            >
              Add all missing standard steps
            </button>
          )}
        </div>

        {/* Live progress preview */}
        <div className="rounded-lg bg-[#f4f5fa] p-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#141414]">
            <span>
              {steps.length === 0
                ? "No steps yet"
                : `${doneCount} of ${steps.length} step${steps.length === 1 ? "" : "s"} done`}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e4e8ef]">
            <div className="h-full rounded-full bg-[#15803d] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {steps.map((s) => (
          <div key={s.id} className="flex gap-2">
            <input
              name="step_label"
              value={s.label}
              onChange={(e) => updateStep(s.id, { label: e.target.value })}
              list="step-presets"
              placeholder="Step name, e.g. Final Yard Pickup"
              className={input}
              aria-label="Step name"
            />
            <select
              name="step_status"
              value={s.status}
              onChange={(e) => updateStep(s.id, { status: e.target.value })}
              className={`${input} w-40 shrink-0`}
              aria-label="Step status"
            >
              {Object.entries(STEP_STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setSteps((x) => x.filter((r) => r.id !== s.id))} className="rounded-md px-2 text-[#6B6E76] hover:bg-red-50 hover:text-red-600" aria-label="Remove step">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {fe.steps && <p className="text-xs text-red-600">{fe.steps}</p>}
        {steps.length < MAX_STEPS && (
          <button type="button" onClick={() => setSteps((x) => [...x, { id: nextId(), label: "", status: "TODO" }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#141414] hover:text-[#b8941f]">
            <Plus size={15} /> Add custom step
          </button>
        )}
        <div className="grid gap-4 border-t border-[#eee] pt-4 sm:grid-cols-[1fr_200px]">
          <Field name="alertText" title="Action-required banner (optional)" defaultValue={initial.alertText} error={fe.alertText} placeholder="Please upload your Certificate of Insurance (COI) to finalize your IRP and release the vehicle." hint="Leave blank to hide it unless a step is Pending." />
          <Field name="alertActionLabel" title="Banner button" defaultValue={initial.alertActionLabel} error={fe.alertActionLabel} />
        </div>
      </Section>

      <Section title="Financial breakdown" description="Add a suffix like “/ mo” for recurring amounts. Pick “No badge” for plain line items.">
        {charges.map((c) => (
          <div key={c.id} className="grid gap-2 rounded-lg border border-[#eee] p-3 sm:grid-cols-[1.3fr_1.3fr_100px_90px_130px_auto] sm:border-0 sm:p-0">
            <input name="charge_label" defaultValue={c.label} placeholder="Base Monthly Lease" className={input} aria-label="Charge label" />
            <input name="charge_note" defaultValue={c.note} placeholder="Includes 12,000 mi" className={input} aria-label="Charge note" />
            <input name="charge_amount" defaultValue={c.amount} placeholder="3650" inputMode="decimal" className={input} aria-label="Amount" />
            <input name="charge_suffix" defaultValue={c.suffix} placeholder="/ mo" className={input} aria-label="Amount suffix, e.g. / mo" />
            <select name="charge_status" defaultValue={c.status || "NONE"} className={input} aria-label="Charge status">
              <option value="NONE">No badge</option>
              <option value="PAID">Paid</option>
              <option value="PROCESSING">Processing</option>
              <option value="DUE">Due</option>
            </select>
            <button type="button" onClick={() => setCharges((x) => x.filter((r) => r.id !== c.id))} className="rounded-md px-2 text-[#6B6E76] hover:bg-red-50 hover:text-red-600" aria-label="Remove charge">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {fe.charges && <p className="text-xs text-red-600">{fe.charges}</p>}
        {charges.length < 12 && (
          <button type="button" onClick={() => setCharges((x) => [...x, { id: nextId(), label: "", note: "", amount: "", suffix: "", status: "NONE" }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#141414] hover:text-[#b8941f]">
            <Plus size={15} /> Add charge
          </button>
        )}
      </Section>

      <Section title="Documents" description={`List the documents for this portal. Attach a file now (PDF, JPG, PNG, WEBP or DOCX · ${MAX_FILE_SIZE / 1024 / 1024}MB each · up to ${maxFiles} files at a time) or leave the file empty to list it as pending and upload it later from the dashboard.`}>
        <datalist id="doc-kinds">
          {DOCUMENT_KINDS.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        {docs.map((d) => (
          <div key={d.id} className="grid gap-2 rounded-lg border border-[#eee] p-3 sm:grid-cols-[1.2fr_1fr_1.3fr_auto]">
            <input name="doc_kind" list="doc-kinds" placeholder="Document name" className={input} aria-label="Document name" />
            <input name="doc_note" placeholder="Note, e.g. Signed Oct 20" className={input} aria-label="Document note" />
            <input type="file" name="doc_file" accept={acceptAttr} className={`${input} file:mr-3 file:rounded file:border-0 file:bg-[#141414] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#D4AF37]`} aria-label="File (optional)" />
            <button type="button" onClick={() => setDocs((x) => x.filter((r) => r.id !== d.id))} className="rounded-md px-2 text-[#6B6E76] hover:bg-red-50 hover:text-red-600" aria-label="Remove document">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {docs.length < maxNewFiles && (
          <button type="button" onClick={() => setDocs((x) => [...x, { id: nextId() }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#141414] hover:text-[#b8941f]">
            <Plus size={15} /> Add a document
          </button>
        )}
      </Section>

      <Section title="Support box" description="Shown as “Need Assistance?” on the dashboard. Leave all three blank to hide it.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="supportName" title="Account manager" defaultValue={initial.supportName} error={fe.supportName} placeholder="Anna Liu" />
          <Field name="supportEmail" title="Support email" type="email" defaultValue={initial.supportEmail} error={fe.supportEmail} />
          <Field name="supportPhone" title="Support phone" defaultValue={initial.supportPhone} error={fe.supportPhone} />
        </div>
      </Section>

      <Section title="Extra details (optional)">
        <Field name="dealerName" title="Dealer name (sidebar footer)" defaultValue={initial.dealerName} error={fe.dealerName} />
        <div>
          <label htmlFor="maintenanceNotes" className={label}>Maintenance notes</label>
          <textarea id="maintenanceNotes" name="maintenanceNotes" rows={4} defaultValue={initial.maintenanceNotes} className={input} placeholder="Service history, scheduled inspections…" />
          {fe.maintenanceNotes && <p className="mt-1 text-xs text-red-600">{fe.maintenanceNotes}</p>}
        </div>
      </Section>

      {state.error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[#141414] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#D4AF37] transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

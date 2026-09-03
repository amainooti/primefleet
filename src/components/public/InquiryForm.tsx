"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryFormState } from "@/app/trucks/[slug]/actions";

const initialState: InquiryFormState = { status: "idle" };

export function InquiryForm({
  truckId,
  stockNumber,
}: {
  truckId: string;
  stockNumber: string;
}) {
  const boundAction = submitInquiry.bind(null, truckId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  if (state.status === "success") {
    return (
      <div className="mt-8 border border-[#E4E4E2] p-4">
        <p className="font-semibold">Inquiry sent</p>
        <p className="mt-1 text-sm text-[#6B6E76]">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-3 border border-[#E4E4E2] p-4">
      <p className="font-semibold">Interested in this listing?</p>
      <p className="text-sm text-[#6B6E76]">
        Send an inquiry about stock #{stockNumber} and we&apos;ll follow up directly.
      </p>

      {state.status === "error" && state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div>
        <label className="block text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full border border-[#E4E4E2] px-3 py-2 text-sm"
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full border border-[#E4E4E2] px-3 py-2 text-sm"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="phone">
          Phone (optional)
        </label>
        <input
          id="phone"
          name="phone"
          className="mt-1 w-full border border-[#E4E4E2] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="mt-1 w-full border border-[#E4E4E2] px-3 py-2 text-sm"
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-[#141414] px-4 py-2 text-sm font-semibold text-[#D4AF37] disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}
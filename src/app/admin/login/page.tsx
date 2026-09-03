"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8">
        <h1 className="text-xl font-bold text-black">Prime Fleet Admin</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full rounded border border-black/20 px-3 py-2"
          required
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-black py-2 font-semibold text-[#D4AF37] disabled:opacity-50"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
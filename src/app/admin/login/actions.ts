"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Password is required." };
  }

  const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH ?? "");

  if (!isValid) {
    return { error: "Invalid password." };
  }

  await createSession();
  redirect("/admin");
}
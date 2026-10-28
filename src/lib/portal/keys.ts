import crypto from "crypto";

/** Public, unguessable share token (≈128 bits). */
export function generateSlug() {
  return crypto.randomBytes(16).toString("base64url");
}

/** Secret that unlocks editing / uploads (≈192 bits). Shown once to the creator. */
export function generateManageKey() {
  return crypto.randomBytes(24).toString("base64url");
}

export function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function keyMatches(key: string | undefined | null, hash: string) {
  if (!key) return false;
  const a = Buffer.from(hashKey(key), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

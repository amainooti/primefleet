import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// NOTE: writes to the local filesystem. This works on a persistent VPS but
// NOT on Vercel serverless (read-only FS outside /tmp, which doesn't persist).
// Swap this module out for an S3/R2-backed implementation before deploying
// the upload path to Vercel.

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "trucks");
const PUBLIC_PATH_PREFIX = "/uploads/trucks";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class StorageError extends Error {}

function extensionFor(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

export async function saveTruckImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new StorageError(`Unsupported image type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new StorageError("Image exceeds 5MB limit");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `${PUBLIC_PATH_PREFIX}/${filename}`;
}
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const KEY_PREFIX = "trucks";

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

  const filename = `${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const key = `${KEY_PREFIX}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

// Used by the one-time migration script and future scrape imports,
// which already have a raw Buffer rather than a File object.
export async function uploadBufferToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_URL}/${key}`;
}
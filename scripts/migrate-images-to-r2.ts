import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/client";
import { uploadBufferToR2 } from "@/lib/storage/r2";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "trucks");

async function main() {
  const images = await prisma.truckImage.findMany({
    where: { url: { startsWith: "/uploads/trucks/" } },
  });

  console.log(`Found ${images.length} images to migrate`);

  let migrated = 0;
  let failed = 0;

  for (const img of images) {
    const filename = path.basename(img.url);
    const localPath = path.join(UPLOADS_DIR, filename);

    try {
      const buffer = await readFile(localPath);
      const ext = path.extname(filename).toLowerCase();
      const contentType =
        ext === ".webp" ? "image/webp" :
        ext === ".png" ? "image/png" :
        ext === ".avif" ? "image/avif" :
        "image/jpeg";

      const newUrl = await uploadBufferToR2(`trucks/${filename}`, buffer, contentType);

      await prisma.truckImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });

      console.log(`  migrated ${filename} -> ${newUrl}`);
      migrated++;
    } catch (err) {
      console.error(`  FAILED ${filename}:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`Done. Migrated: ${migrated}, Failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
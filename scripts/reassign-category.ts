// scripts/reassign-category.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const FROM_CATEGORY = process.argv[2] ?? "TruckPaper Inventory";
const TO_CATEGORY = process.argv[3] ?? "Box Trucks";
const APPLY = process.argv.includes("--write");

async function main() {
  const fromCategory = await prisma.category.findUnique({
    where: { slug: slugify(FROM_CATEGORY) },
  });
  if (!fromCategory) {
    console.log(`No category found matching "${FROM_CATEGORY}" — nothing to move.`);
    return;
  }

  const trucks = await prisma.truck.findMany({
    where: { categoryId: fromCategory.id },
    select: { id: true, stockNumber: true, title: true },
  });

  if (trucks.length === 0) {
    console.log(`Category "${FROM_CATEGORY}" has no trucks — nothing to move.`);
    return;
  }

  console.log(`Found ${trucks.length} truck(s) in "${FROM_CATEGORY}":`);
  for (const truck of trucks) {
    console.log(`  ${truck.stockNumber} | ${truck.title}`);
  }

  if (!APPLY) {
    console.log(`\nDry run — pass --write to actually move these to "${TO_CATEGORY}".`);
    return;
  }

  const toCategory = await prisma.category.upsert({
    where: { slug: slugify(TO_CATEGORY) },
    update: { name: TO_CATEGORY },
    create: { name: TO_CATEGORY, slug: slugify(TO_CATEGORY) },
  });

  const result = await prisma.truck.updateMany({
    where: { categoryId: fromCategory.id },
    data: { categoryId: toCategory.id },
  });

  console.log(`\nMoved ${result.count} truck(s) from "${FROM_CATEGORY}" to "${TO_CATEGORY}".`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
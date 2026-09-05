// scripts/delete-category.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CATEGORY_NAME = process.argv[2] ?? "TruckPaper Inventory";
const APPLY = process.argv.includes("--write");

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: slugify(CATEGORY_NAME) },
  });

  if (!category) {
    console.log(`No category found matching "${CATEGORY_NAME}" — nothing to delete.`);
    return;
  }

  const truckCount = await prisma.truck.count({ where: { categoryId: category.id } });

  if (truckCount > 0) {
    console.log(
      `"${CATEGORY_NAME}" still has ${truckCount} truck(s) assigned to it — refusing to delete. ` +
        `Reassign them first (see reassign-category.ts).`,
    );
    return;
  }

  console.log(`"${CATEGORY_NAME}" (id: ${category.id}) has 0 trucks — safe to delete.`);

  if (!APPLY) {
    console.log("Dry run — pass --write to actually delete this category.");
    return;
  }

  await prisma.category.delete({ where: { id: category.id } });
  console.log(`Deleted category "${CATEGORY_NAME}".`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
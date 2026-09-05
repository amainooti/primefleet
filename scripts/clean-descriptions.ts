// scripts/clean-descriptions.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--write");

function cleanDescription(text: string): string {
  return text
    .replace(/\s*at TruckPaper\.com/gi, "")   // remove the phrase only, leave the period
    .replace(/\s+\./g, ".")                    // fix "Pennsylvania ." -> "Pennsylvania."
    .replace(/\s+/g, " ")                      // collapse any doubled spaces
    .trim();
}

async function main() {
  const trucks = await prisma.truck.findMany({
    where: { description: { contains: "TruckPaper.com", mode: "insensitive" } },
    select: { id: true, stockNumber: true, title: true, description: true },
  });

  const candidates = trucks.filter(
    (truck): truck is typeof truck & { description: string } =>
      typeof truck.description === "string" && truck.description.length > 0,
  );

  if (candidates.length === 0) {
    console.log('No trucks found with a non-null description containing "TruckPaper.com".');
    return;
  }

  console.log(`Found ${candidates.length} truck(s) to clean:\n`);

  const updates: Array<{ id: string; stockNumber: string; before: string; after: string }> = [];

  for (const truck of candidates) {
    const before = truck.description;
    const after = await cleanDescription(before);
    if (after === before) continue;

    updates.push({ id: truck.id, stockNumber: truck.stockNumber, before, after });
    console.log(`${truck.stockNumber} | ${truck.title}`);
    console.log(`  before: ${before}`);
    console.log(`  after:  ${after}\n`);
  }

  if (!APPLY) {
    console.log(`Dry run — pass --write to actually update these ${updates.length} description(s).`);
    return;
  }

  for (const update of updates) {
    await prisma.truck.update({
      where: { id: update.id },
      data: { description: update.after },
    });
  }

  console.log(`Updated ${updates.length} truck description(s).`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
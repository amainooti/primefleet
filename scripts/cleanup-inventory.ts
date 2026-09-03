import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function report() {
  const trucks = await prisma.truck.findMany({
    orderBy: [{ manufacturer: "asc" }, { model: "asc" }, { createdAt: "asc" }],
    include: { specifications: true, images: true },
  });

  console.log(`\nTotal trucks: ${trucks.length}\n`);

  // Group by manufacturer+model+year to surface likely duplicates.
  // This is a heuristic, not a guarantee — review before deleting.
  const groups = new Map<string, typeof trucks>();
  for (const truck of trucks) {
    const key = `${truck.manufacturer}|${truck.model}|${truck.year}`;
    groups.set(key, [...(groups.get(key) ?? []), truck]);
  }

  console.log("=== Possible duplicate groups (same manufacturer+model+year) ===");
  for (const [key, group] of groups) {
    if (group.length > 1) {
      console.log(`\n${key}`);
      for (const t of group) {
        console.log(
          `  id=${t.id} stock=${t.stockNumber} slug=${t.slug} specs=${t.specifications.length} images=${t.images.length} createdAt=${t.createdAt.toISOString()}`,
        );
      }
    }
  }

  console.log("\n=== All trucks (for manual review) ===");
  for (const t of trucks) {
    console.log(
      `id=${t.id} stock=${t.stockNumber} title="${t.title}" specs=${t.specifications.length} images=${t.images.length} desc="${(t.description ?? "").slice(0, 60)}..."`,
    );
  }
}

async function deleteTruckById(id: string) {
  // Delete children first to avoid FK errors, then the truck itself.
  await prisma.$transaction([
    prisma.specification.deleteMany({ where: { truckId: id } }),
    prisma.truckImage.deleteMany({ where: { truckId: id } }),
    prisma.inquiry.deleteMany({ where: { truckId: id } }),
    prisma.truck.delete({ where: { id } }),
  ]);
  console.log(`Deleted truck ${id}`);
}

async function fixPF000124() {
  const truck = await prisma.truck.findUnique({
    where: { stockNumber: "PF-000124" },
    include: { specifications: true },
  });
  if (!truck) {
    console.log("PF-000124 not found, skipping fix.");
    return;
  }
  await prisma.$transaction([
    prisma.specification.deleteMany({ where: { truckId: truck.id } }),
    prisma.truck.update({
      where: { id: truck.id },
      data: {
        description:
          "Reliable box truck, well-maintained and ready for rental. Ideal for local deliveries and moving jobs.",
      },
    }),
  ]);
  console.log(`Fixed PF-000124: cleared ${truck.specifications.length} bad specification row(s), reset description.`);
}

function pickKeeper<T extends { specifications: unknown[]; images: unknown[]; createdAt: Date }>(group: T[]): T {
  // Prefer the record with more filled-in data (specs, then images);
  // fall back to the oldest record if it's a tie.
  return [...group].sort((a, b) => {
    if (b.specifications.length !== a.specifications.length) {
      return b.specifications.length - a.specifications.length;
    }
    if (b.images.length !== a.images.length) {
      return b.images.length - a.images.length;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0];
}

async function dedupe(apply: boolean) {
  const trucks = await prisma.truck.findMany({
    include: { specifications: true, images: true },
  });

  const groups = new Map<string, typeof trucks>();
  for (const truck of trucks) {
    const key = `${truck.manufacturer}|${truck.model}|${truck.year}`;
    groups.set(key, [...(groups.get(key) ?? []), truck]);
  }

  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);
  if (duplicateGroups.length === 0) {
    console.log("No duplicate groups found (matched on manufacturer+model+year).");
    return;
  }

  for (const group of duplicateGroups) {
    const keeper = pickKeeper(group);
    const toDelete = group.filter((t) => t.id !== keeper.id);

    console.log(`\nGroup: ${keeper.manufacturer} ${keeper.model} ${keeper.year}`);
    console.log(`  KEEP   id=${keeper.id} stock=${keeper.stockNumber} specs=${keeper.specifications.length} images=${keeper.images.length}`);
    for (const t of toDelete) {
      console.log(`  ${apply ? "DELETE" : "would delete"} id=${t.id} stock=${t.stockNumber} specs=${t.specifications.length} images=${t.images.length}`);
    }

    if (apply) {
      for (const t of toDelete) {
        await prisma.$transaction([
          prisma.specification.deleteMany({ where: { truckId: t.id } }),
          prisma.truckImage.deleteMany({ where: { truckId: t.id } }),
          prisma.inquiry.deleteMany({ where: { truckId: t.id } }),
          prisma.truck.delete({ where: { id: t.id } }),
        ]);
      }
    }
  }

  console.log(apply ? "\nDone — duplicates removed." : "\nDry run only — nothing deleted. Re-run with 'dedupe apply' to actually delete.");
}

async function main() {
  const mode = process.argv[2];

  if (mode === "report") {
    await report();
  } else if (mode === "fix-pf124") {
    await fixPF000124();
  } else if (mode === "delete") {
    const id = process.argv[3];
    if (!id) throw new Error("Usage: cleanup-inventory delete <truckId>");
    await deleteTruckById(id);
  } else if (mode === "dedupe") {
    await dedupe(process.argv[3] === "apply");
  } else {
    console.log("Usage:");
    console.log("  tsx scripts/cleanup-inventory.ts report          # list trucks + flag possible dupes");
    console.log("  tsx scripts/cleanup-inventory.ts fix-pf124       # fix the corrupted Freightliner record");
    console.log("  tsx scripts/cleanup-inventory.ts delete <id>     # delete one truck by id, cascading children");
    console.log("  tsx scripts/cleanup-inventory.ts dedupe          # dry run: preview which dupes would be deleted");
    console.log("  tsx scripts/cleanup-inventory.ts dedupe apply    # actually delete the duplicates");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
import "dotenv/config";
import { spawn } from "node:child_process";

function quoteArg(arg: string): string {
  // Only used for the human-readable log line below — spawn() with an args
  // array passes each element as its own argument, so no manual shell
  // quoting is needed for the actual process invocation.
  return /\s/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

// Fill in each category's real TruckPaper URL (grab it from the address bar
// when browsing that category on truckpaper.com — the trailing number is a
// category ID that differs per category and isn't guessable).
const CATEGORIES: Array<{ name: string; url: string }> = [
  { name: "Box Trucks", url: "https://www.truckpaper.com/listings/for-sale/box-trucks/16004" },
  { name: "Flatbed Trucks", url: "https://www.truckpaper.com/listings/for-sale/flatbed-trucks/16019" },
  { name: "Drop Deck Trailers", url: "https://www.truckpaper.com/listings/for-sale/drop-deck-trailers-semi-trailers/12" },
  { name: "Day Cab Trucks", url: "https://www.truckpaper.com/listings/for-sale/day-cab-trucks/16013" },
  { name: "Sleeper Trucks", url: "https://www.truckpaper.com/listings/for-sale/sleeper-trucks/16045" },
  { name: "Flatbed Trailers", url: "https://www.truckpaper.com/listings/for-sale/flatbed-trailers-semi-trailers/14" },
  { name: "Tow Trucks", url: "https://www.truckpaper.com/listings/for-sale/tow-trucks/16060" },
  { name: "Tank Trailers", url: "https://www.truckpaper.com/listings/for-sale/tank-trailers-semi-trailers/21" },
  { name: "Reefer Trailers", url: "https://www.truckpaper.com/listings/for-sale/reefer-trailers-semi-trailers/20" },
  { name: "Dry Van Trailers", url: "https://www.truckpaper.com/listings/for-sale/dry-van-trailers-semi-trailers/15022" },
];

const LIMIT_PER_CATEGORY = process.argv.includes("--limit")
  ? process.argv[process.argv.indexOf("--limit") + 1]
  : "5";
const DELAY_BETWEEN_LISTINGS = process.argv.includes("--delay")
  ? process.argv[process.argv.indexOf("--delay") + 1]
  : "4000";
const DELAY_BETWEEN_CATEGORIES_MS = 8000;
const DRY_RUN = !process.argv.includes("--write");

async function runCategory(category: { name: string; url: string }): Promise<void> {
  const args = [
    "tsx",
    "scripts/import-truckpaper.ts",
    "--url",
    category.url,
    "--limit",
    LIMIT_PER_CATEGORY,
    "--delay",
    DELAY_BETWEEN_LISTINGS,
    "--category",
    category.name,
    "--cdp",
  ];
  if (!DRY_RUN) args.push("--write");

  console.log(`\n=== ${category.name} ===`);
  console.log(`Running: npx ${args.map(quoteArg).join(" ")}`);

  await new Promise<void>((resolve) => {
    const child = spawn("npx", args, {
      stdio: "inherit", // stream child's stdout/stderr live instead of buffering
      shell: true,
    });
    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(`${category.name} exited with code ${code}`);
      }
      resolve(); // always continue to next category, even on failure
    });
    child.on("error", (error) => {
      console.error(`Failed to start process for ${category.name}:`, error.message);
      resolve();
    });
  });
}

async function main() {
  console.log(
    DRY_RUN
      ? "Dry run — no --write flag passed, nothing will be saved. Pass --write to actually import."
      : "Writing to database — --write flag detected.",
  );

  for (let i = 0; i < CATEGORIES.length; i += 1) {
    await runCategory(CATEGORIES[i]);
    if (i < CATEGORIES.length - 1) {
      console.log(`Waiting ${DELAY_BETWEEN_CATEGORIES_MS}ms before next category...`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CATEGORIES_MS));
    }
  }

  console.log("\nAll categories processed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
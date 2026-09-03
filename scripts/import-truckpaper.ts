import * as cheerio from "cheerio";
import "dotenv/config";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { Condition, PrismaClient, TruckStatus } from "@prisma/client";
import { chromium } from "playwright";

const prisma = new PrismaClient();
const BASE_URL = "https://www.truckpaper.com";
const DEFAULT_URL = `${BASE_URL}/listings/for-sale/trucks-and-trailers/all`;
const USER_AGENT = "PrimeFleet inventory importer/1.0 (contact your site administrator)";
const execFileAsync = promisify(execFile);
const IMAGE_DIR = path.join(process.cwd(), "public", "uploads", "trucks");

type Listing = {
  stockNumber: string;
  year: number;
  manufacturer: string;
  model: string;
  title: string;
  description: string;
  rateDisplay: string;
  location?: string;
  imageUrl?: string;
  sourceUrl: string;
  specifications: Array<{ group: string; name: string; value: string }>;
};

type Options = {
  url: string;
  listingUrl?: string;
  pages: number;
  delayMs: number;
  limit?: number;
  write: boolean;
  categoryName: string;
  cdp: boolean;
};

function parseOptions(): Options {
  const args = process.argv.slice(2);
  const valueAfter = (name: string) => {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args[index + 1];
  };
  const numberOption = (name: string, fallback: number) => {
    const value = valueAfter(name);
    const parsed = value ? Number(value) : fallback;
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer`);
    return parsed;
  };

  const listingUrl = valueAfter("--listing-url");
  if (listingUrl && !listingUrl.startsWith(`${BASE_URL}/listing/for-sale/`)) {
    throw new Error("--listing-url must be a TruckPaper /listing/for-sale/ detail page URL");
  }

  const url = valueAfter("--url") ?? DEFAULT_URL;
  // Only validate --url as a category page if we're not doing a single-listing import.
  if (!listingUrl && !url.startsWith(`${BASE_URL}/listings/`)) {
    throw new Error("--url must be a TruckPaper /listings/ URL");
  }

  return {
    url,
    listingUrl,
    pages: numberOption("--pages", 1),
    delayMs: numberOption("--delay", 1500),
    limit: valueAfter("--limit") ? numberOption("--limit", 1) : undefined,
    write: args.includes("--write"),
    categoryName: valueAfter("--category") ?? "TruckPaper Inventory",
    cdp: args.includes("--cdp"),
  };
}

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function listingIdFromUrl(url: string): string | undefined {
  return url.match(/\/listing\/for-sale\/(\d+)\//)?.[1];
}

function parseTitle(title: string): { year: number; manufacturer: string; model: string } | undefined {
  const match = title.match(/^(\d{4})\s+([^\s]+)\s+(.+)$/);
  if (!match) return undefined;
  const year = Number(match[1]);
  if (year < 1900 || year > 2100) return undefined;
  return { year, manufacturer: match[2].toUpperCase(), model: match[3].trim() };
}

// Detail-page titles are messier than listing-card titles — e.g. an og:title
// of "Used 2027 BENSON 48 ft x 102 in Aluminum For Sale" — so this searches
// for the year/manufacturer/model pattern anywhere in the string instead of
// requiring it at position 0, and strips a trailing "For Sale" if present.
function parseListingTitle(title: string): { year: number; manufacturer: string; model: string } | undefined {
  const match = title.match(/(\d{4})\s+([A-Za-z0-9-]+)\s+(.+?)(?:\s+for sale)?$/i);
  if (!match) return undefined;
  const year = Number(match[1]);
  if (year < 1900 || year > 2100) return undefined;
  return { year, manufacturer: match[2].toUpperCase(), model: match[3].trim() };
}

function parseListings(html: string): Listing[] {
  const $ = cheerio.load(html);
  const listings = new Map<string, Listing>();

  $("a[href*='/listing/for-sale/']").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const sourceUrl = new URL(href, BASE_URL).toString();
    const id = listingIdFromUrl(sourceUrl);
    const title = cleanText($(element).text());
    const parsedTitle = parseTitle(title);
    if (!id || !parsedTitle || listings.has(id)) return;

    const card = $(element).closest("article, li, .listing, .listing-card, .machine");
    const text = cleanText(card.length ? card.text() : $(element).parent().text());
    const priceMatch = text.match(/(?:USD\s*)?\$[\d,]+(?:\.\d{2})?|CALL FOR PRICE/i);
    const imageElement = card.find("img[src], img[data-src], img[data-lazy-src]").first().length
      ? card.find("img[src], img[data-src], img[data-lazy-src]").first()
      : $(element).parents().slice(0, 8).find("img[src], img[data-src], img[data-lazy-src]").first();
    const imageUrl = imageElement.attr("src") ?? imageElement.attr("data-src") ?? imageElement.attr("data-lazy-src");
    const locationMatch = text.match(/Location:\s*([^|]+?)(?:Seller:|Mileage:|$)/i);
    const rateDisplay = cleanText(priceMatch?.[0]) || "Contact for price";

    listings.set(id, {
      stockNumber: `TP-${id}`,
      ...parsedTitle,
      title,
      description: `${title} imported from TruckPaper.`,
      rateDisplay,
      location: cleanText(locationMatch?.[1]) || undefined,
      imageUrl: imageUrl ? new URL(imageUrl, BASE_URL).toString() : undefined,
      sourceUrl,
      specifications: [],
    });
  });

  return [...listings.values()];
}

// Builds a single Listing shell directly from one detail-page URL, for
// --listing-url imports. populateDetailImages() fills in the image,
// description, and specifications afterward — same as it does for listings
// discovered via a category page.
async function buildSingleListing(url: string, useCdp: boolean): Promise<Listing> {
  const id = listingIdFromUrl(url);
  if (!id) throw new Error(`Could not extract a listing id from URL: ${url}`);

  const html = await fetchPage(url, useCdp);
  const $ = cheerio.load(html);

  const ogTitle = cleanText($("meta[property='og:title']").attr("content"));
  const h1Title = cleanText($("h1").first().text());
  const rawTitle = ogTitle || h1Title;

  const parsedTitle = parseListingTitle(rawTitle);
  if (!parsedTitle) {
    throw new Error(`Could not parse year/manufacturer/model from title: "${rawTitle}"`);
  }

  const bodyText = cleanText($("body").text());
  const priceMatch = bodyText.match(/(?:USD\s*)?\$[\d,]+(?:\.\d{2})?|CALL FOR PRICE/i);
  const locationMatch = bodyText.match(/Location:\s*([^|]+?)(?:Seller:|Mileage:|$)/i);

  return {
    stockNumber: `TP-${id}`,
    ...parsedTitle,
    title: rawTitle,
    description: `${rawTitle} imported from TruckPaper.`,
    rateDisplay: cleanText(priceMatch?.[0]) || "Contact for price",
    location: cleanText(locationMatch?.[1]) || undefined,
    sourceUrl: url,
    specifications: [],
  };
}

function imageExtension(contentType: string | null, sourceUrl: string): string {
  const mimeType = contentType?.split(";")[0].trim().toLowerCase();
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/avif") return "avif";
  if (mimeType === "image/jpeg") return "jpg";
  const extension = path.extname(new URL(sourceUrl).pathname).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(extension) ? extension.slice(1) : "jpg";
}

async function downloadImage(sourceUrl: string, stockNumber: string): Promise<string> {
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": USER_AGENT, accept: "image/avif,image/webp,image/apng,image/*" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const contentType = response.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("image/")) throw new Error("response was not an image");
  await mkdir(IMAGE_DIR, { recursive: true });
  const filename = `${stockNumber.toLowerCase()}.${imageExtension(contentType, sourceUrl)}`;
  await writeFile(path.join(IMAGE_DIR, filename), Buffer.from(await response.arrayBuffer()));
  return `/uploads/trucks/${filename}`;
}

async function populateDetailImages(listings: Listing[]): Promise<void> {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];
  if (!context) throw new Error("No browser context found at localhost:9222");
  const page = await context.newPage();
  try {
    for (const listing of listings) {
      try {
        await page.goto(listing.sourceUrl, { waitUntil: "load", timeout: 30_000 });

        const expectedId = listingIdFromUrl(listing.sourceUrl);
        if (!expectedId || !page.url().includes(expectedId)) {
          console.warn(
            `  URL mismatch for ${listing.stockNumber} (expected id ${expectedId ?? "?"}, landed on ${page.url()}); skipping detail scrape`,
          );
          continue;
        }

        const metadata = await page.locator("meta[property='og:image'], meta[name='description']").evaluateAll((elements) =>
          elements.map((element) => ({
            name: element.getAttribute("property") ?? element.getAttribute("name"),
            value: element.getAttribute("content") ?? "",
          })),
        );
        const imageUrl = metadata.find((item) => item.name === "og:image")?.value;
        if (imageUrl) {
          listing.imageUrl = new URL(imageUrl, BASE_URL).toString();
          console.log(`  Found photo for ${listing.stockNumber}`);
        }
        const detailDescription = metadata.find((item) => item.name === "description")?.value;
        if (detailDescription) {
          const [summary, ...detailLines] = detailDescription.split(/\n+/).map(cleanText).filter(Boolean);
          listing.description = summary.replace(/\s+at TruckPaper\.com\.?$/i, ".").replace(/\s*Source:\s*.*$/i, "");
          let group = "Details";
          const specifications = new Map<string, { group: string; name: string; value: string }>();
          for (const line of detailLines) {
            if (/^(Engine|Transmission|Dimensions|Measurements|Chassis|Interior|Seating|Other|Standard Specifications)$/i.test(line)) {
              group = line;
              continue;
            }
            const match = line.match(/^([^:]{2,50}):\s*(.+)$/);
            if (match && match[2].length > 0 && !/^(Call|Text|Follow us|Email Seller|Seller)$/i.test(match[1])) {
              specifications.set(`${group}:${match[1]}`, { group, name: match[1], value: match[2] });
            }
          }
          listing.specifications = [...specifications.values()];
        }
      } catch (error) {
        console.warn(`  Photo lookup skipped for ${listing.stockNumber}: ${error instanceof Error ? error.message : error}`);
      }
    }
  } finally {
    if (!page.isClosed()) await page.close();
  }
}

async function fetchPage(url: string, useCdp: boolean): Promise<string> {
  if (useCdp) {
    const browser = await chromium.connectOverCDP("http://localhost:9222");
    const context = browser.contexts()[0];
    if (!context) throw new Error("No browser context found at localhost:9222");
    const page = await context.newPage();
    try {
        await page.goto(url, { waitUntil: "commit", timeout: 30_000 }).catch((error: unknown) => {
          if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) throw error;
          console.warn("  Navigation interrupted; reading the committed page.");
        });
        console.log(`  -> landed on: ${page.url()} | title: ${await page.title()}`);

        return await page.locator("html").evaluate((element) => element.outerHTML);
    } finally {
        if (!page.isClosed()) await page.close();
    }
    }

  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.ok) return response.text();

  try {
    const result = await execFileAsync("curl.exe", [
      "-L",
      "-sS",
      "-A",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
      "-H",
      "Accept: text/html,application/xhtml+xml",
      url,
    ]);
    if (result.stdout.trim()) return result.stdout;
  } catch {}
  throw new Error(`${response.status} ${response.statusText} for ${url}; TruckPaper may require an approved feed or browser session`);
}

function pageUrl(url: string, page: number): string {
  if (page === 1) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("page", String(page));
  return parsed.toString();
}

async function importListings(listings: Listing[], options: Options): Promise<void> {
  const categorySlug = slugify(options.categoryName) || "truckpaper-inventory";
  if (!options.write) {
    console.log(`Dry run: ${listings.length} listing(s) parsed. Pass --write to save them.`);
    for (const listing of listings) {
      console.log(`${listing.stockNumber} | ${listing.title} | ${listing.rateDisplay}`);
    }
    return;
  }

  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    update: { name: options.categoryName },
    create: { name: options.categoryName, slug: categorySlug },
  });
  let created = 0;
  let updated = 0;

  for (const listing of listings) {
    const existing = await prisma.truck.findUnique({ where: { stockNumber: listing.stockNumber } });
    let localImageUrl: string | undefined;
    if (listing.imageUrl) {
      try {
        localImageUrl = await downloadImage(listing.imageUrl, listing.stockNumber);
        console.log(`  Downloaded image: ${localImageUrl}`);
      } catch (error) {
        console.warn(`  Image skipped for ${listing.stockNumber}: ${error instanceof Error ? error.message : error}`);
      }
    }
    const data = {
      slug: `truckpaper-${listing.stockNumber.toLowerCase()}`,
      year: listing.year,
      manufacturer: listing.manufacturer,
      model: listing.model,
      title: listing.title,
      description: listing.description,
      categoryId: category.id,
      condition: Condition.USED,
      status: TruckStatus.AVAILABLE,
      rateDisplay: listing.rateDisplay,
      location: listing.location,
    };

    const truck = await prisma.truck.upsert({
      where: { stockNumber: listing.stockNumber },
      update: data,
      create: {
        ...data,
        stockNumber: listing.stockNumber,
        images: localImageUrl
          ? { create: [{ url: localImageUrl, alt: listing.title, isPrimary: true }] }
          : undefined,
      },
    });
    if (listing.specifications.length > 0) {
      await prisma.$transaction([
        prisma.specification.deleteMany({ where: { truckId: truck.id } }),
        prisma.specification.createMany({
          data: listing.specifications.map((specification, index) => ({
            truckId: truck.id,
            ...specification,
            sortOrder: index,
          })),
        }),
      ]);
    }
    if (localImageUrl) {
      const primaryImage = await prisma.truckImage.findFirst({ where: { truckId: truck.id, isPrimary: true } });
      if (primaryImage) {
        await prisma.truckImage.update({ where: { id: primaryImage.id }, data: { url: localImageUrl, alt: listing.title } });
      } else {
        await prisma.truckImage.create({ data: { truckId: truck.id, url: localImageUrl, alt: listing.title, isPrimary: true } });
      }
    }
    if (existing) updated += 1;
    else created += 1;
    console.log(`${existing ? "Updated" : "Imported"}: ${truck.stockNumber} ${truck.title}`);
  }
  console.log(`Saved ${created} new listing(s), updated ${updated}.`);
}

async function main() {
  const options = parseOptions();

  if (options.listingUrl) {
    console.log(`Fetching single listing: ${options.listingUrl}`);
    const listing = await buildSingleListing(options.listingUrl, options.cdp);
    if (options.write && options.cdp) await populateDetailImages([listing]);
    await importListings([listing], options);
    return;
  }

  const listings = new Map<string, Listing>();
  for (let page = 1; page <= options.pages; page += 1) {
    const url = pageUrl(options.url, page);
    console.log(`Fetching page ${page}/${options.pages}: ${url}`);
    const pageListings = parseListings(await fetchPage(url, options.cdp));
    for (const listing of pageListings) listings.set(listing.stockNumber, listing);
    if (page < options.pages) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
  }

  const selected = [...listings.values()].slice(0, options.limit);
  if (options.write && options.cdp) await populateDetailImages(selected);
  await importListings(selected, options);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
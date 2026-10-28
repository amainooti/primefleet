import * as cheerio from "cheerio";
import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { Condition, PrismaClient, TruckStatus } from "@prisma/client";
import { chromium } from "playwright";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();
const BASE_URL = "https://www.truckpaper.com";
const DEFAULT_URL = `${BASE_URL}/listings/for-sale/trucks-and-trailers/all`;
const USER_AGENT = "PrimeFleet inventory importer/1.0 (contact your site administrator)";
const CDP_ENDPOINT = "http://localhost:9222";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

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
  categoryName?: string;
  createCategory: boolean;
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
    categoryName: (() => {
      const value = valueAfter("--category");
      return value && !value.startsWith("--") ? value : undefined;
    })(),
    createCategory: args.includes("--create-category"),
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

  const html = await fetchPage(url, useCdp, "meta[property='og:title'], h1");
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

  const extension = imageExtension(contentType, sourceUrl);
  const filename = `${stockNumber.toLowerCase()}.${extension}`;
  const key = `trucks/${filename}`;
  const buffer = Buffer.from(await response.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType.split(";")[0].trim(),
    }),
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

async function populateDetailImages(listings: Listing[], delayMs: number): Promise<void> {
  const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
  const context = browser.contexts()[0];
  if (!context) throw new Error(`No browser context found at ${CDP_ENDPOINT}`);
  const page = await context.newPage();
  try {
    for (const [index, listing] of listings.entries()) {
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      console.log(`  Detail page ${index + 1}/${listings.length}: ${listing.stockNumber}`);
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

// readySelector: an element that must exist before the HTML is read, so we
// don't grab the page before the client-side render has produced the content.
async function fetchPage(
  url: string,
  useCdp: boolean,
  readySelector = "a[href*='/listing/for-sale/']",
): Promise<string> {
  if (useCdp) {
    const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
    const context = browser.contexts()[0];
    if (!context) throw new Error(`No browser context found at ${CDP_ENDPOINT}`);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch((error: unknown) => {
        if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) throw error;
        console.warn("  Navigation interrupted; reading the committed page.");
      });
      await page.waitForSelector(readySelector, { timeout: 20_000, state: "attached" }).catch(() => {
        console.warn(`  "${readySelector}" did not appear within 20s.`);
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
  throw new Error(
    `${response.status} ${response.statusText} for ${url}; re-run with --cdp to use your approved browser session, or use an approved TruckPaper feed`,
  );
}

function pageUrl(url: string, page: number): string {
  if (page === 1) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("page", String(page));
  return parsed.toString();
}

// Guesses the category from the TruckPaper URL, e.g. .../listings/for-sale/box-trucks/16004
// -> "box-trucks" -> the existing "Box Trucks" category. Single-listing URLs carry no
// category segment, so they get no suggestion.
function suggestCategory(
  options: Options,
  categories: Array<{ id: string; name: string; slug: string }>,
): { id: string; name: string; slug: string } | undefined {
  if (options.listingUrl) return undefined;
  const segment = new URL(options.url).pathname.split("/").filter(Boolean)[2];
  if (!segment) return undefined;
  const singular = (value: string) => value.replace(/s$/, "");
  return (
    categories.find((category) => category.slug === segment) ??
    categories.find((category) => singular(category.slug) === singular(segment))
  );
}

// Picks the category for --write runs. Never silently creates one:
//  - --category "Box Trucks"  -> must match an existing category (by slug)
//  - --create-category        -> allows creating a new one with that name
//  - no --category            -> shows the existing categories and asks you to pick
async function resolveCategory(options: Options): Promise<{ id: string; name: string }> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  let name = options.categoryName;

  if (!name) {
    if (!process.stdin.isTTY) {
      throw new Error('--category is required with --write (for example: --category "Box Trucks")');
    }
    const suggestion = suggestCategory(options, categories);
    console.log("\nNo --category given. Existing categories:");
    categories.forEach((category, index) => console.log(`  ${index + 1}. ${category.name}`));
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      const prompt = suggestion
        ? `\nSuggested: ${suggestion.name} (matched from the URL). Press Enter to accept, type a number to pick another, or q to cancel: `
        : "\nEnter a number (or q to cancel): ";
      const answer = (await rl.question(prompt)).trim();
      if (answer === "" && suggestion) {
        console.log(`Using category: ${suggestion.name}\n`);
        return { id: suggestion.id, name: suggestion.name };
      }
      const choice = Number(answer);
      if (!Number.isInteger(choice) || choice < 1 || choice > categories.length) {
        throw new Error("Cancelled: no category selected. Nothing was written.");
      }
      const picked = categories[choice - 1];
      console.log(`Using category: ${picked.name}\n`);
      return { id: picked.id, name: picked.name };
    } finally {
      rl.close();
    }
  }

  const slug = slugify(name);
  const match = categories.find((category) => category.slug === slug);
  if (match) return { id: match.id, name: match.name };

  if (!options.createCategory) {
    throw new Error(
      `No category matches "${name}". Existing categories: ${categories.map((c) => c.name).join(", ")}.\n` +
        `Use one of those exactly, or add --create-category to create "${name}".`,
    );
  }
  const created = await prisma.category.create({ data: { name, slug } });
  console.log(`Created new category: ${created.name}`);
  return { id: created.id, name: created.name };
}

async function importListings(
  listings: Listing[],
  options: Options,
  category?: { id: string; name: string },
): Promise<void> {
  if (!options.write) {
    console.log(`Dry run: ${listings.length} listing(s) parsed. Pass --write to save them.`);
    for (const listing of listings) {
      console.log(`${listing.stockNumber} | ${listing.title} | ${listing.rateDisplay}`);
    }
    return;
  }

  if (!category) throw new Error("A category is required with --write.");
  console.log(`Category: ${category.name}`);
  let created = 0;
  let updated = 0;

  for (const listing of listings) {
    const existing = await prisma.truck.findUnique({ where: { stockNumber: listing.stockNumber } });
    let localImageUrl: string | undefined;
    if (listing.imageUrl) {
      try {
        localImageUrl = await downloadImage(listing.imageUrl, listing.stockNumber);
        console.log(`  Uploaded image: ${localImageUrl}`);
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

  // Settle the category before any browsing, so a missing/wrong one fails fast.
  const category = options.write ? await resolveCategory(options) : undefined;

  if (options.listingUrl) {
    console.log(`Fetching single listing: ${options.listingUrl}`);
    const listing = await buildSingleListing(options.listingUrl, options.cdp);
    if (options.write && options.cdp) await populateDetailImages([listing], options.delayMs);
    await importListings([listing], options, category);
    return;
  }

  const listings = new Map<string, Listing>();
  for (let page = 1; page <= options.pages; page += 1) {
    const url = pageUrl(options.url, page);
    console.log(`Fetching page ${page}/${options.pages}: ${url}`);
    const html = await fetchPage(url, options.cdp);
    const pageListings = parseListings(html);
    console.log(`  Parsed ${pageListings.length} listing(s) from page ${page}`);
    if (pageListings.length === 0) {
      const debugFile = `debug-page-${page}.html`;
      writeFileSync(debugFile, html);
      console.warn(`  Nothing parsed; saved the page HTML to ${debugFile} so you can inspect the link format.`);
    }
    for (const listing of pageListings) listings.set(listing.stockNumber, listing);
    if (page < options.pages) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
  }

  const selected = [...listings.values()].slice(0, options.limit);
  if (selected.length === 0) {
    console.warn("No listings found; nothing to import. The database was not touched.");
    return;
  }
  if (options.write && options.cdp) await populateDetailImages(selected, options.delayMs);
  await importListings(selected, options, category);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
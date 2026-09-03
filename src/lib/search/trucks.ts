import { prisma } from "@/lib/db/client";
import type { Condition, Prisma, TruckStatus } from "@prisma/client";

// Statuses a public visitor is allowed to browse. ARCHIVED listings are
// never shown on the public site, regardless of filters applied.
const PUBLIC_VISIBLE_STATUSES: TruckStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "RENTED",
  "MAINTENANCE",
];

const VALID_CONDITIONS: Condition[] = ["NEW", "USED"];
const VALID_STATUSES: TruckStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "RENTED",
  "MAINTENANCE",
];

export function parseCondition(value?: string): Condition | undefined {
  return VALID_CONDITIONS.includes(value as Condition)
    ? (value as Condition)
    : undefined;
}

export function parseStatus(value?: string): TruckStatus | undefined {
  return VALID_STATUSES.includes(value as TruckStatus)
    ? (value as TruckStatus)
    : undefined;
}

export type TruckSort = "newest" | "oldest" | "year-desc" | "year-asc";

export type TruckFilters = {
  q?: string;
  category?: string; // category slug
  manufacturer?: string;
  condition?: Condition;
  status?: TruckStatus;
  sort?: TruckSort;
};

export function buildTruckWhere(filters: TruckFilters): Prisma.TruckWhereInput {
  const { q, category, manufacturer, condition, status } = filters;

  const where: Prisma.TruckWhereInput = {
    status: status ?? { in: PUBLIC_VISIBLE_STATUSES },
  };

  if (q) {
  const terms = q.split(/[\s-]+/).filter(Boolean);
  where.AND = terms.map((term) => ({
    OR: [
      { title: { contains: term, mode: "insensitive" } },
      { manufacturer: { contains: term, mode: "insensitive" } },
      { model: { contains: term, mode: "insensitive" } },
      { stockNumber: { contains: term, mode: "insensitive" } },
    ],
  }));
}

  if (category) {
    where.category = { slug: category };
  }

  if (manufacturer) {
    where.manufacturer = manufacturer;
  }

  if (condition) {
    where.condition = condition;
  }

  return where;
}

function buildTruckOrderBy(sort?: TruckSort): Prisma.TruckOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "year-desc":
      return { year: "desc" };
    case "year-asc":
      return { year: "asc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export async function getTrucks(filters: TruckFilters) {
  return prisma.truck.findMany({
    where: buildTruckWhere(filters),
    orderBy: buildTruckOrderBy(filters.sort),
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
}

export async function getTruckBySlug(slug: string) {
  return prisma.truck.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: [{ group: "asc" }, { sortOrder: "asc" }] },
    },
  });
}

export async function getFilterOptions() {
  const [categories, manufacturerRows] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.truck.findMany({
      where: { status: { in: PUBLIC_VISIBLE_STATUSES } },
      select: { manufacturer: true },
      distinct: ["manufacturer"],
      orderBy: { manufacturer: "asc" },
    }),
  ]);

  return {
    categories,
    manufacturers: manufacturerRows.map((row) => row.manufacturer),
  };
}
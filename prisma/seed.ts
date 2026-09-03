import { PrismaClient, Condition, TruckStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const flatbed = await prisma.category.upsert({
    where: { slug: "flatbed-trailers" },
    update: {},
    create: { name: "Flatbed Trailers", slug: "flatbed-trailers" },
  });

  const boxTruck = await prisma.category.upsert({
    where: { slug: "box-trucks" },
    update: {},
    create: { name: "Box Trucks", slug: "box-trucks" },
  });

  const truck1 = await prisma.truck.upsert({
    where: { slug: "2027-benson-48-ft-x-102-in-aluminum" },
    update: {},
    create: {
      slug: "2027-benson-48-ft-x-102-in-aluminum",
      stockNumber: "PF-000123",
      year: 2027,
      manufacturer: "BENSON",
      model: "48 ft x 102 in Aluminum",
      title: "2027 BENSON 48 ft x 102 in Aluminum",
      description:
        "Well-maintained aluminum flatbed trailer, ready for rental. Ideal for freight and equipment hauling.",
      categoryId: flatbed.id,
      condition: Condition.NEW,
      status: TruckStatus.AVAILABLE,
      rateDisplay: "$450/day",
      location: "Austin, TX",
      images: {
        create: [
          {
            url: "/uploads/placeholder-trailer-1.jpg",
            alt: "2027 Benson flatbed trailer, side view",
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
      specifications: {
        create: [
          { group: "Dimensions", name: "Length", value: "48 ft", sortOrder: 0 },
          { group: "Dimensions", name: "Width", value: "102 in", sortOrder: 1 },
          { group: "Construction", name: "Composition", value: "Aluminum", sortOrder: 0 },
          { group: "Features", name: "Coil Package", value: "Yes", sortOrder: 0 },
          { group: "Features", name: "Side Rails", value: "Yes", sortOrder: 1 },
          { group: "Features", name: "Winches", value: "12, Sliding", sortOrder: 2 },
          { group: "Features", name: "Landing Gear", value: "Two Speed", sortOrder: 3 },
        ],
      },
    },
  });

  const truck2 = await prisma.truck.upsert({
    where: { slug: "2025-freightliner-m2-box-truck" },
    update: {},
    create: {
      slug: "2025-freightliner-m2-box-truck",
      stockNumber: "PF-000124",
      year: 2025,
      manufacturer: "FREIGHTLINER",
      model: "M2 106",
      title: "2025 FREIGHTLINER M2 106 Box Truck",
      description: "Reliable 26ft box truck, great for local moves and delivery routes.",
      categoryId: boxTruck.id,
      condition: Condition.USED,
      status: TruckStatus.AVAILABLE,
      rateDisplay: "$220/day",
      location: "Austin, TX",
      images: {
        create: [
          {
            url: "/uploads/placeholder-boxtruck-1.jpg",
            alt: "2025 Freightliner M2 box truck, front view",
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
      specifications: {
        create: [
          { group: "Dimensions", name: "Box Length", value: "26 ft", sortOrder: 0 },
          { group: "Engine", name: "Type", value: "Diesel", sortOrder: 0 },
          { group: "Features", name: "Liftgate", value: "Yes", sortOrder: 0 },
        ],
      },
    },
  });

  console.log({ truck1: truck1.slug, truck2: truck2.slug });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
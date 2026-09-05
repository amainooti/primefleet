import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.truck
  .findMany({ where: { description: null }, select: { stockNumber: true, title: true } })
  .then((r) => {
    console.log(r);
    return p.$disconnect();
  });
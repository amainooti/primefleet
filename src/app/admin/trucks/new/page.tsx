import { prisma } from "@/lib/db/client";
import { TruckForm } from "@/components/admin/TruckForm";
import { createTruck } from "../actions";

export default async function NewTruckPage() {
  const categories = await prisma.category.findMany();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Add Truck</h1>
      <TruckForm categories={categories} action={createTruck} />
    </div>
  );
}
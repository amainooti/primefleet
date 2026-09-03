import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { TruckForm } from "@/components/admin/TruckForm";
import { updateTruck } from "../../actions";

export default async function EditTruckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [truck, categories] = await Promise.all([
    prisma.truck.findUnique({
      where: { id },
      include: {
        specifications: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany(),
  ]);

  if (!truck) notFound();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Truck</h1>
      <TruckForm
        categories={categories}
        action={updateTruck.bind(null, id)}
        defaultValues={truck}
        truckId={truck.id}
      />
    </div>
  );
}
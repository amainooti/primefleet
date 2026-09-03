import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { archiveTruck } from "./actions";

export default async function AdminTrucksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const trucks = await prisma.truck.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { manufacturer: { contains: q, mode: "insensitive" } },
            { stockNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Link href="/admin/trucks/new" className="rounded bg-black px-4 py-2 text-[#D4AF37] font-semibold">
          + Add Truck
        </Link>
      </div>

      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search inventory..." className="border rounded px-3 py-2 w-full max-w-sm" />
      </form>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Stock</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trucks.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">{t.stockNumber}</td>
              <td>{t.title}</td>
              <td>{t.category.name}</td>
              <td>{t.status}</td>
              <td className="space-x-2">
                <Link href={`/admin/trucks/${t.id}/edit`} className="text-blue-600 underline">Edit</Link>
                <form action={archiveTruck.bind(null, t.id)} className="inline">
                  <button type="submit" className="text-red-600 underline">Archive</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
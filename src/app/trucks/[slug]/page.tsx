import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/components/public/PublicShell";
import { StatusBadge } from "@/components/public/StatusBadge";
import { InquiryForm } from "@/components/public/InquiryForm";
import { getTruckBySlug } from "@/lib/search/trucks";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const truck = await getTruckBySlug(slug);

  if (!truck) {
    return { title: "Listing not found | Prime Fleet" };
  }

  return {
    title: `${truck.title} | Prime Fleet`,
    description: truck.description ?? undefined,
  };
}

export default async function TruckDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const truck = await getTruckBySlug(slug);

  if (!truck || truck.status === "ARCHIVED") {
    notFound();
  }

  const groupedSpecs = truck.specifications.reduce<
    Record<string, typeof truck.specifications>
  >((acc, spec) => {
    acc[spec.group] = acc[spec.group] ? [...acc[spec.group], spec] : [spec];
    return acc;
  }, {});

  const primaryImage =
    truck.images.find((img) => img.isPrimary) ?? truck.images[0];

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/trucks"
          className="text-sm text-[#6B6E76] hover:text-[#141414]"
        >
          ← Back to inventory
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <div className="flex aspect-[4/3] w-full items-center justify-center border border-[#E4E4E2] bg-[#E4E4E2]">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage.url}
                  alt={primaryImage.alt ?? truck.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-[#6B6E76]">
                  No image available
                </span>
              )}
            </div>
            {truck.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {truck.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.alt ?? truck.title}
                    className="aspect-square w-full border border-[#E4E4E2] object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="font-mono text-sm text-[#6B6E76]">
              Stock #{truck.stockNumber}
            </p>
            <div className="mt-1 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">
                {truck.title}
              </h1>
              <StatusBadge status={truck.status} />
            </div>
            <p className="mt-1 text-[#6B6E76]">
              {truck.category.name}, {truck.condition === "NEW" ? "New" : "Used"}
              {truck.location ? `, ${truck.location}` : ""}
            </p>
            <p className="mt-4 text-2xl font-bold">{truck.rateDisplay}</p>

            {truck.description && (
              <p className="mt-6 leading-relaxed">{truck.description}</p>
            )}

            <InquiryForm truckId={truck.id} stockNumber={truck.stockNumber} />
          </div>
        </div>

        {Object.keys(groupedSpecs).length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold tracking-tight">
              Specifications
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {Object.entries(groupedSpecs).map(([group, specs]) => (
                <div key={group}>
                  <h3 className="border-b border-[#E4E4E2] pb-2 font-semibold">
                    {group}
                  </h3>
                  <dl className="mt-2 space-y-1">
                    {specs.map((spec) => (
                      <div key={spec.id} className="flex justify-between text-sm">
                        <dt className="text-[#6B6E76]">{spec.name}</dt>
                        <dd className="font-medium">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
import Image from "next/image";

export function AboutSection() {
  const principles = [
    "Every truck and trailer in this fleet is ours — nothing here is a third-party listing.",
    "Units are inspected between rentals, not just before they're first listed.",
    "Specs, condition, and availability status are kept current on every listing.",
  ];

  return (
    <section id="about" className="border-b border-[#E4E4E2] bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden lg:order-2">
          <Image
            src="https://images.unsplash.com/photo-1670509295484-df0c2512fec4?auto=format&fit=crop&w=1200&q=80"
            alt="Prime Fleet truck on the road"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="lg:order-1">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            One fleet. One owner. No markups.
          </h2>
          <p className="mt-4 max-w-lg text-[#6B6E76]">
            Prime Fleet isn&apos;t a marketplace reselling someone else&apos;s
            inventory. Every truck and trailer listed here belongs to us,
            which means the specs, the photos, and the availability status
            you see are accurate the moment you look.
          </p>

          <ul className="mt-8 divide-y divide-[#E4E4E2] border-t border-[#E4E4E2]">
            {principles.map((point) => (
              <li key={point} className="flex gap-4 py-4">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
                <span className="text-[#141414]">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
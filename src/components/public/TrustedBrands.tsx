const BRANDS = [
  {
    name: "Freightliner",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/freightliner.PNG?v=11",
  },
  {
    name: "International",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/international.PNG?v=11",
  },
  {
    name: "Ford",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/ford.PNG?v=11",
  },
  {
    name: "Peterbilt",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/peterbilt.PNG?v=11",
  },
  {
    name: "Mack",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/mack.PNG?v=11",
  },
  {
    name: "Chevrolet",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/chevrolet.PNG?v=11",
  },
  {
    name: "Dorsey",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/dorsey.PNG?v=11",
  },
  {
    name: "Fontaine",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/fontaine.PNG?v=11",
  },
  {
    name: "Utility",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/utility.PNG?v=11",
  },
  {
    name: "GMC",
    logo: "https://www.truckpaper.com/content/Truck/images/popular-brands/gmc.PNG?v=11",
  },
];

export function TrustedBrands() {
  return (
    <section className="bg-white">
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 2));
          }
        }

        .marquee-track {
          animation: marquee 60s linear infinite;
          will-change: transform;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .marquee-container::before,
        .marquee-container::after {
          content: '';
          position: absolute;
          top: 0;
          height: 100%;
          width: 80px;
          z-index: 10;
          pointer-events: none;
        }

        .marquee-container::before {
          left: 0;
          background: linear-gradient(to right, white, transparent);
        }

        .marquee-container::after {
          right: 0;
          background: linear-gradient(to left, white, transparent);
        }
      `}</style>

      <div className="mx-auto max-w-full px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-baseline justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#6B6E76]">
                Trusted By
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#141414]">
                Premium Brands We Service
              </h2>
            </div>
          </div>

          <div className="marquee-container relative overflow-hidden">
            <div className="marquee-track flex gap-8">
              {/* Original brands */}
              {BRANDS.map((brand) => (
                <div
                  key={`${brand.name}-1`}
                  className="flex flex-shrink-0 items-center justify-center transition-all duration-300 hover:opacity-100"
                  style={{ minWidth: "200px" }}
                >
                  <div className="group flex h-24 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-[#E4E4E2] bg-white p-4 shadow-sm transition-all hover:border-[#D4AF37] hover:shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                    />
                    <span className="text-xs font-semibold text-[#6B6E76] transition-colors group-hover:text-[#D4AF37]">
                      {brand.name}
                    </span>
                  </div>
                </div>
              ))}

              {/* Duplicated brands for seamless loop */}
              {BRANDS.map((brand) => (
                <div
                  key={`${brand.name}-2`}
                  className="flex flex-shrink-0 items-center justify-center transition-all duration-300 hover:opacity-100"
                  style={{ minWidth: "200px" }}
                >
                  <div className="group flex h-24 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-[#E4E4E2] bg-white p-4 shadow-sm transition-all hover:border-[#D4AF37] hover:shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                    />
                    <span className="text-xs font-semibold text-[#6B6E76] transition-colors group-hover:text-[#D4AF37]">
                      {brand.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
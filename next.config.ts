import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pub-c6bf5098db1a472a817346a13307fa94.r2.dev" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  experimental: {
    // Public portal form uploads up to 4 files x 10MB per submit (default limit is 1MB).
    serverActions: { bodySizeLimit: "45mb" },
  },
};

export default nextConfig;
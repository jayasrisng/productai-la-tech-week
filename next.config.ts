  import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep verification builds from rewriting the live preview's manifests.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  turbopack: { root: process.cwd() },
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;

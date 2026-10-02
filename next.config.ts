  import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // With output: export, a custom production distDir names the static export folder.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  turbopack: { root: process.cwd() },
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;

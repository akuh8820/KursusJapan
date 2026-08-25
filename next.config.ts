import type { NextConfig } from "next";

/**
 * Static export untuk GitHub Pages.
 * NEXT_PUBLIC_BASE_PATH diisi saat build CI (mis. "/fasih");
 * kosong saat dev lokal supaya tanpa prefix.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;

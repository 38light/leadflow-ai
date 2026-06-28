import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Disable filesystem cache to avoid rename issues with spaces in path
    webpackBuildWorker: false,
  },
};

export default nextConfig;

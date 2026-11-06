import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: { root: process.cwd() },
  webpack(config, { dev }) {
    // Production builds don't need the filesystem pack cache. Keeping it off
    // also avoids large-string serialization and path-rename cache problems.
    if (!dev) config.cache = false;
    return config;
  },
  images: {
    remotePatterns: [],
  },
  // Keep native/large server-only deps (local embeddings + doc parsers) out of
  // the webpack bundle — they must run from node_modules at runtime.
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
    "sharp",
    "pdf-parse",
    "mammoth",
  ],
  experimental: {
    // Disable filesystem cache to avoid rename issues with spaces in path
    webpackBuildWorker: false,
  },
};

export default nextConfig;

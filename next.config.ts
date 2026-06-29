import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
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

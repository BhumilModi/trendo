import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./lib/images";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828],
    imageSizes: [64, 128],
    qualities: [55, 60],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

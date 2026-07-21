import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  async rewrites() {
    return [
      {
        source: "/generated/:path*",
        destination: "http://localhost:5000/generated/:path*",
      },
    ];
  },
};

export default nextConfig;

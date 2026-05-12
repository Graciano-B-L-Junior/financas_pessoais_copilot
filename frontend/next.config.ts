import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ["**/tests/**", "jest.setup.ts", "**/node_modules/**"],
    };
    return config;
  },
};

export default nextConfig;

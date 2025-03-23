import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.zshfoj.com",
      },
    ],
  },
};

export default nextConfig;

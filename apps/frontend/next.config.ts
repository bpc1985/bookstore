import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bookstore/ui", "@bookstore/lib"],
  // Enable standalone output for Docker production builds
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;

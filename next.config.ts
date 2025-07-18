import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/aquarius',
  assetPrefix: '/aquarius',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

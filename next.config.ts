import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "@prisma/client"],
    instrumentationHook: true,
  },
};

export default nextConfig;

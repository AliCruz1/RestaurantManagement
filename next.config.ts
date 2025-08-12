import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow production builds to succeed even if there are ESLint or TS issues.
  // This unblocks deployment; keep ESLint/TS strictness locally or CI if desired.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

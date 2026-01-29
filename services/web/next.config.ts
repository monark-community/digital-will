import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // When packages have package.json, add them: transpilePackages: ["@digital-will/shared", ...],
};

export default nextConfig;

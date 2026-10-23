import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Keep tracing rooted at this Next.js app so Vercel builds don't
  // depend on a local machine path for the monorepo parent.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

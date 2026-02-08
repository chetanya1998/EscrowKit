import type { NextConfig } from "next";

const isGithubPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'gh-pages';

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

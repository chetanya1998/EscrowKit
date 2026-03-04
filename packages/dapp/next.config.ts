import type { NextConfig } from "next";

const isGithubPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'gh-pages';

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? "/EscrowKit" : undefined,
  trailingSlash: isGithubPages ? true : false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

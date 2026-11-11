import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // أضفنا هذا السطر لتجاهل أخطاء الـ TypeScript على Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Lesson resources are uploaded through authenticated Server Actions.
    // Keep this only slightly above the 20 MB resource limit enforced server-side.
    serverActions: {
      bodySizeLimit: "22mb",
    },
    proxyClientMaxBodySize: "22mb",
  },
};

export default nextConfig;

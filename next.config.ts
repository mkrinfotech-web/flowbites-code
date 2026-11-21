import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
      },
      {
        protocol: "https",
        hostname: "vvlyqvahfaowwjaflumd.supabase.co",
      },
    ],
  },
};

export default nextConfig;

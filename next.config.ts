import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: "/services/vinyl", destination: "/services/vinyl-banner", permanent: true },
      { source: "/services/ppboard", destination: "/services/pp-board", permanent: true },
      { source: "/services/rollup", destination: "/services/roll-up", permanent: true },
      { source: "/services/label", destination: "/services/label-sticker", permanent: true },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qlxxqrpsyjdsiyjnabjb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "displayworksmedia.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.displayworksmedia.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

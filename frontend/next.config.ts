import type { NextConfig } from "next";

const backendOrigin = (process.env.BACKEND_ORIGIN || "http://127.0.0.1:5001").replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.10.3", "192.168.56.1"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  // Local only: Vercel already rewrites /api and /uploads to the backend service.
  async rewrites() {
    if (process.env.VERCEL) return [];
    return [
      { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backendOrigin}/uploads/:path*` },
    ];
  },
};

export default nextConfig;

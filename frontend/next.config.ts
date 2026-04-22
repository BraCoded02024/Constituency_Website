import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR / dev resources when opening the app via LAN IP (e.g. phone or another device)
  allowedDevOrigins: ["172.20.10.3"],
};

export default nextConfig;

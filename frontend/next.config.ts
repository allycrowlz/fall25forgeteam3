import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow cross-origin requests from local network during development
  allowedDevOrigins: ['10.0.0.112', 'localhost', '127.0.0.1'],
};

// Explicitly set turbopack root to suppress warning about multiple lockfiles
// This tells Next.js to use the frontend directory as the root (where this config file is located)
(nextConfig as any).turbopack = {
  root: process.cwd(),
};

export default nextConfig;

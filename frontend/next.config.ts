/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      { 
        source: '/api/:path*', 
        destination: 'http://localhost:8000/api/:path*'  // Keep /api in the destination
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.licdn.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      // Add any other image hosts you might use
      {
        protocol: 'https',
        hostname: '**.amazonaws.com', // For S3 buckets
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // For GitHub avatars
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google avatars
      },
    ],
  },
};
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
};

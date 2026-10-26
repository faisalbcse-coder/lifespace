/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  output: 'standalone',
  allowedDevOrigins: ['10.66.102.57', 'localhost:3000', '127.0.0.1:3000'],
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050',
  },
  // Enable production optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Optimize builds
  swcMinify: true,
  // Configure image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
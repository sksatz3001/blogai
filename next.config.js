/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better performance
  reactStrictMode: true,
  
  // Optimize production builds
  swcMinify: true,
  
  // Enable optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compress responses
  compress: true,
  
  // Optimize font loading
  optimizeFonts: true,
}

module.exports = nextConfig

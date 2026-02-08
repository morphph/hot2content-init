import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export', // Static export for Vercel/GitHub Pages
  trailingSlash: true,
  images: {
    unoptimized: true // For static export
  }
}

export default nextConfig

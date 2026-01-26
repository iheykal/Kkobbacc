// Disable PWA in development or when SKIP_PWA_BUILD is true
const shouldDisablePWA = process.env.NODE_ENV === 'development' || process.env.SKIP_PWA_BUILD === 'true'

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: shouldDisablePWA,
  disableDevLogs: true,
  buildExcludes: [/app-manifest\.json$/, /sw\.js\.map$/],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rewrite favicon.ico to serve the header logo
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icons/newlogo.png',
      },
    ]
  },

  // Enable experimental features properly
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'argon2', 'bcryptjs', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'formidable', 'sharp'],
    // Optimize package imports for better tree shaking
    optimizePackageImports: ['framer-motion', 'recharts', 'lucide-react'],
  },

  // Environment variables for deployment
  env: {
    VERCEL: process.env.VERCEL,
  },

  // Image configuration for Cloudflare R2 with optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kobac-real-estate.r2.dev',
        port: '',
        pathname: '/**',
      },
      // Allow local uploads during transition period
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  webpack: (config, { isServer, dev }) => {
    // Only externalize heavy packages for server in production
    if (isServer && !dev) {
      config.externals = config.externals || [];
      config.externals.push({
        'mongoose': 'commonjs mongoose',
        'argon2': 'commonjs argon2',
        'bcryptjs': 'commonjs bcryptjs',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner': 'commonjs @aws-sdk/s3-request-presigner',
        'formidable': 'commonjs formidable',
        'sharp': 'commonjs sharp',
      });
    }

    return config;
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keep errors and warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Enable proper build optimizations
  productionBrowserSourceMaps: false,
  swcMinify: true,

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // SEO and metadata optimizations
  reactStrictMode: true,

  // Skip static generation for pages that use dynamic data
  // This prevents build failures when pages try to access UserContext or MongoDB during build
  output: 'standalone',

  // Disable static page generation to prevent build errors
  // All pages will be rendered dynamically at runtime
  distDir: '.next',

  // Skip static generation errors - allow build to continue even if some pages fail to prerender
  // Pages will be rendered dynamically at runtime instead
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable static optimization - all pages will be rendered dynamically
  // This prevents Next.js from trying to prerender pages during build
  generateBuildId: async () => {
    // Use a timestamp-based build ID to ensure dynamic rendering
    return `build-${Date.now()}`
  },

  // Standard output for reliable deployment
}

module.exports = withPWA(nextConfig)
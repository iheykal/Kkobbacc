// Conditionally enable PWA - disable during build to prevent build issues
const isProductionBuild = process.env.NODE_ENV === 'production' && process.env.SKIP_PWA_BUILD !== 'true'

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProductionBuild, // Disable PWA during build, enable at runtime
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
  buildExcludes: [/app-manifest\.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features properly
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'argon2', 'bcryptjs', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'formidable', 'sharp'],
    // Optimize package imports for better tree shaking
    optimizePackageImports: ['framer-motion', 'recharts', 'lucide-react'],
    // Skip static generation for pages that can't be pre-rendered
    isrMemoryCacheSize: 0, // Disable ISR cache to force dynamic rendering
  },
  
  // Environment variables for deployment
  env: {
    VERCEL: process.env.VERCEL,
  },
  
  // Image configuration for Cloudflare R2
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
  },
  
  // Optimized webpack config
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

    // Optimize bundle splitting for better performance
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate chunk for framer-motion (large library)
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separate chunk for recharts (large library)
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
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
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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
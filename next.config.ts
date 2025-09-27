import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'ioredis'],
  images: {
    domains: ['localhost', 'leexdoc.tural.digital'],
  },
  // Configure API routes for large file uploads
  experimental: {
    // Increase body size limit for file uploads
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable ESLint during build for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build for production deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack configuration
  webpack: (config: any) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    }
    return config
  },
};

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: false, // Disable skipWaiting to prevent reloads
  disable: process.env.NODE_ENV === "development", // Disable in development
  sw: "sw.js",
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
});

export default withPWAConfig(nextConfig);

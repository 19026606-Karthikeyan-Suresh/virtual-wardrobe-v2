import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler for automatic memoisation
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        // Allow Supabase Storage images
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Allow Supabase Image Transformations (resized thumbnails)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              // Allow connections to all external APIs we use
              "connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://*.fal.ai https://generativelanguage.googleapis.com",
              "worker-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
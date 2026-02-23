import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/contacto',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/admin/dashboard',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/admin/settings/general',
        destination: '/admin/settings',
        permanent: true,
      },
      {
        source: '/admin/settings/profile',
        destination: '/admin/profile',
        permanent: true,
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/entities/:path*',
        destination: '/api/technical/entities/:path*',
      },
      {
        source: '/api/rag/:path*',
        destination: '/api/technical/rag/:path*',
      }
    ];
  },
};

export default withNextIntl(nextConfig);

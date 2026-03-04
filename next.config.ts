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
      },
      // Phase 272: Route Deduplication & Ghost Page Audit
      {
        source: '/admin/my-documents',
        destination: '/admin/knowledge/my-docs',
        permanent: true,
      },
      {
        source: '/admin/knowledge-base',
        destination: '/admin/knowledge',
        permanent: true,
      },
      {
        source: '/admin/knowledge-assets',
        destination: '/admin/knowledge/assets',
        permanent: true,
      },
      {
        source: '/admin/logs',
        destination: '/admin/operations/logs',
        permanent: true,
      },
      {
        source: '/admin/rag-quality',
        destination: '/admin/ai/rag-quality',
        permanent: true,
      },
      {
        source: '/admin/spaces',
        destination: '/admin/knowledge/spaces',
        permanent: true,
      },
      {
        source: '/admin/knowledge-base/graph',
        destination: '/admin/knowledge/graph',
        permanent: true,
      },
      {
        source: '/spaces',
        destination: '/admin/knowledge/spaces',
        permanent: true,
      },
      {
        source: '/support-dashboard',
        destination: '/admin/support',
        permanent: true,
      },
      {
        source: '/support-ticket',
        destination: '/support/nuevo',
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

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
      // Phase 320: Unified Navigation Architecture Legacy Redirects
      // Temporarily permanent: false during migration phase
      { source: '/admin/ai/:path*', destination: '/agents/:path*', permanent: false },
      { source: '/admin/knowledge/:path*', destination: '/intelligence/:path*', permanent: false },
      { source: '/admin/reports/:path*', destination: '/insights/:path*', permanent: false },
      { source: '/admin/organizations/:path*', destination: '/settings/organization/:path*', permanent: false },
      { source: '/admin/permissions/:path*', destination: '/settings/permissions/:path*', permanent: false },
      { source: '/admin/operations/:path*', destination: '/settings/system/operations/:path*', permanent: false },
      { source: '/admin/audit/:path*', destination: '/insights/audit/:path*', permanent: false },
      { source: '/admin/notifications/:path*', destination: '/settings/system/notifications/:path*', permanent: false },
      { source: '/admin/settings/:path*', destination: '/settings/:path*', permanent: false },
      { source: '/admin/labs/:path*', destination: '/help/labs/:path*', permanent: false },
      { source: '/admin/support/:path*', destination: '/help/support/:path*', permanent: false },
      { source: '/admin/api-docs', destination: '/help/api', permanent: false },
      { source: '/entities/:path*', destination: '/work/orders/:path*', permanent: false },
      { source: '/graphs', destination: '/intelligence/graph', permanent: false },
      { source: '/my-documents', destination: '/intelligence/my-docs', permanent: false },
      { source: '/work/documents', destination: '/intelligence/my-docs', permanent: false },
      { source: '/work/tasks', destination: '/work/tasks_legacy', permanent: false },
      { source: '/work/validations', destination: '/work/checklists', permanent: false },
      { source: '/admin/compliance', destination: '/insights/compliance', permanent: false },
      { source: '/admin/security/audit', destination: '/insights/audit?tab=security', permanent: false },
      { source: '/admin/security/sessions', destination: '/settings/system/security/sessions', permanent: false },
      {
        source: '/contacto',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/admin/dashboard',
        destination: '/admin-dashboard',
        permanent: true,
      },
      {
        source: '/admin/settings/general',
        destination: '/settings',
        permanent: true,
      },
      {
        source: '/admin/settings/profile',
        destination: '/settings/profile',
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

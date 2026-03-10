'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import 'swagger-ui-react/swagger-ui.css';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { Code2, Loader2 } from "lucide-react";

// Importación dinámica para evitar problemas de SSR con SwaggerUI
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <SwaggerLoading />
});

function SwaggerLoading() {
  const t = useTranslations('admin.api_docs');
  return (
    <div className="h-[600px] flex flex-col items-center justify-center text-muted-foreground gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-sm font-medium animate-pulse">{t('loading')}</p>
    </div>
  );
}

export default function ApiDocsPage() {
  const t = useTranslations('admin.api_docs');

  return (
    <PageContainer>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<Code2 className="w-6 h-6 text-primary" />}
      />

      <ContentCard
        title={t('card_title')}
        icon={<div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Code2 size={18} /></div>}
        className="overflow-hidden bg-card border-border shadow-md rounded-xl p-0 mt-6"
      >
        <div className="swagger-ui-container min-h-[700px]">
          <SwaggerUI
            url="/api/swagger/spec?v=1.4.1"
            deepLinking={true}
            displayOperationId={true}
            persistAuthorization={true}
          />
        </div>
      </ContentCard>

      <style jsx global>{`
        /* Ajustes estéticos para Swagger UI en modo oscuro/claro */
        .swagger-ui {
          filter: var(--swagger-filter, none);
          padding: 1rem;
        }
        .dark .swagger-ui {
          --swagger-filter: invert(88%) hue-rotate(180deg);
        }
        .swagger-ui .info {
          margin: 1.5rem 0;
        }
        .swagger-ui .scheme-container {
          background: transparent !important;
          box-shadow: none !important;
          padding: 1rem 0 !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .swagger-ui select {
          cursor: pointer;
        }
        .swagger-ui .opblock {
          border-radius: 12px !important;
          overflow: hidden;
        }
      `}</style>
    </PageContainer>
  );
}

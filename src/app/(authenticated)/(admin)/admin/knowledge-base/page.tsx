"use client";

import { useState } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeExplorer } from "@/components/admin/knowledge/KnowledgeExplorer";
import { UnifiedIngestModal } from "@/components/admin/knowledge/UnifiedIngestModal";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";

export default function KnowledgeBasePage() {
    const t = useTranslations('admin.knowledge');
    const [ingestOpen, setIngestOpen] = useState(false);

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
                actions={
                    <Button onClick={() => setIngestOpen(true)}>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Ingestar Documento
                    </Button>
                }
            />
            <KnowledgeExplorer />
            <UnifiedIngestModal
                isOpen={ingestOpen}
                onClose={() => setIngestOpen(false)}
                onSuccess={() => {
                    // Force refresh explorer if needed, though most things are revalidated 
                    // via server actions or state.
                }}
            />
        </PageContainer>
    );
}

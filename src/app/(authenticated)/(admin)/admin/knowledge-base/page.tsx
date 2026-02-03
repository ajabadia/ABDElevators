
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeExplorer } from "@/components/admin/knowledge/KnowledgeExplorer";
import { useTranslations } from "next-intl";

export default function KnowledgeBasePage() {
    const t = useTranslations('admin.knowledge');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
            />
            <KnowledgeExplorer />
        </PageContainer>
    );
}

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageContainer } from '@/components/ui/page-container';
import GraphExplorer from '@/components/admin/knowledge/GraphExplorer';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('knowledge_graph');
    return {
        title: t('meta_title'),
        description: t('meta_desc')
    };
}

export default async function GraphExplorerPage() {
    const t = await getTranslations('knowledge_graph');

    return (
        <PageContainer>
            <div className="space-y-4">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t('page_title')}</h2>
                        <p className="text-muted-foreground">
                            {t('page_subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex-1 h-[calc(100vh-200px)] min-h-[600px] border rounded-lg bg-card text-card-foreground shadow-sm p-4 overflow-hidden">
                    <GraphExplorer />
                </div>
            </div>
        </PageContainer>
    );
}

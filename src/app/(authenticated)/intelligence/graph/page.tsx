import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FeatureShell } from '@/components/shared/FeatureShell';
import GraphExplorer from '@/components/admin/knowledge/GraphExplorer';
import { Network } from 'lucide-react';

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
        <FeatureShell
            title={t('page_title')}
            subtitle={t('page_subtitle')}
            icon={<Network className="w-6 h-6 text-primary" />}
            backHref="/intelligence"
        >
            <div className="flex-1 h-[calc(100vh-250px)] min-h-[600px] border rounded-lg bg-card text-card-foreground shadow-sm p-4 overflow-hidden mt-6">
                <GraphExplorer />
            </div>
        </FeatureShell>
    );
}

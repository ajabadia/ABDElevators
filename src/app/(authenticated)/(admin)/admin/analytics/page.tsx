import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { getTranslations } from 'next-intl/server';

export default async function AnalyticsPage() {
    const session = await auth();

    if (session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/dashboard');
    }

    const t = await getTranslations('admin.analytics.page');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />
            <ContentCard className="p-0 border-0 bg-transparent shadow-none">
                <PlatformAnalytics />
            </ContentCard>
        </PageContainer>
    );
}

import { requireSuperAdmin } from '@/lib/auth';
import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics';
import { FeatureShell } from "@/components/shared/FeatureShell";
import { ContentCard } from "@/components/ui/content-card";
import { getTranslations } from 'next-intl/server';

/**
 * 📊 Analytics Page
 * Platform metrics and usage statistics.
 */
export default async function AnalyticsPage() {
    await requireSuperAdmin();

    const t = await getTranslations('admin.analytics.page');

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
        >
            <ContentCard className="p-0 border-0 bg-transparent shadow-none">
                <PlatformAnalytics />
            </ContentCard>
        </FeatureShell>
    );
}

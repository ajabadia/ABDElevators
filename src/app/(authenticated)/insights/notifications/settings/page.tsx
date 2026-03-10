import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { NotificationSettingsForm } from '@/components/admin/notifications/NotificationSettingsForm';
import { getTranslations } from 'next-intl/server';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
    await requireRole([UserRole.SUPER_ADMIN]);
    const t = await getTranslations('admin.notifications.settings');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                backHref="/admin/notifications"
            />

            <div className="mt-8">
                <NotificationSettingsForm />
            </div>
        </PageContainer>
    );
}

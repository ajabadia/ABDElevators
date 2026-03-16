import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { NotificationSettingsForm } from '@/components/admin/notifications/NotificationSettingsForm';
import { getTranslations } from 'next-intl/server';
import { FeatureShell } from '@/components/shared/FeatureShell';
import { BellRing } from 'lucide-react';

/**
 * NotificationSettingsPage: Global Alert Config (Phase 112)
 * Standardized with FeatureShell.
 */
export default async function NotificationSettingsPage() {
    await requireRole([UserRole.SUPER_ADMIN]);
    const t = await getTranslations('admin.notifications.settings');

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
            backHref="/insights/notifications"
            icon={<BellRing className="w-6 h-6 text-primary" />}
        >
            <div className="mt-8">
                <NotificationSettingsForm />
            </div>
        </FeatureShell>
    );
}

import { requirePermission } from '@/lib/auth';
import { SuperAdminHubClient } from "./SuperAdminHubClient";
import { FeatureShell } from '@/components/shared/FeatureShell';
import { getTranslations } from 'next-intl/server';
import { Shield } from 'lucide-react';

/**
 * 🏰 SuperAdmin Global Dashboard (Server-Side Enforced)
 * Enforces Guardian policy 'admin:superadmin' before rendering.
 */
export default async function GlobalDashboardPage() {
    await requirePermission('admin:superadmin', 'access');
    const t = await getTranslations('admin_superadmin');

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
            icon={<Shield className="w-6 h-6 text-primary" />}
        >
            <div className="mt-6">
                <SuperAdminHubClient />
            </div>
        </FeatureShell>
    );
}

import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Card } from '@/components/ui/card';
import { ConfigAuditTable } from '@/components/admin/audit/ConfigAuditTable';
import { ConfigAuditService } from '@/services/audit/ConfigAuditService';
import { requirePermission } from '@/lib/auth';
import { ShieldAlert } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function ConfigAuditPage() {
    const user = await requirePermission('admin:security', 'read');
    const events = await ConfigAuditService.getHistory(100, user);
    const t = await getTranslations('observability.audit');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                backHref="/admin/security"
            />

            <div className="space-y-6">
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-4 flex items-start gap-4">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">{t('zone_title')}</h3>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                            {t('zone_desc')}
                        </p>
                    </div>
                </Card>

                <ConfigAuditTable events={events as any} />
            </div>
        </PageContainer>
    );
}

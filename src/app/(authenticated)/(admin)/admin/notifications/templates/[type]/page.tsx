import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { TemplateEditor } from '@/components/admin/notifications/TemplateEditor';
import { getTranslations } from 'next-intl/server';
import { NotificationService } from '@/services/core/NotificationService';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function TemplateEditPage({ params }: { params: Promise<{ type: string }> }) {
    await requireRole([UserRole.SUPER_ADMIN]);
    const { type } = await params;

    const t = await getTranslations('admin.notifications.templates.editor');

    // Buscar template actual vía Service (Rule 11)
    const template = await NotificationService.getTemplateByType(type);

    return (
        <PageContainer>
            <PageHeader
                title={template ? template.name : t('newTitle', { type })}
                subtitle={template ? t('subtitleEdit', { version: template.version }) : t('subtitleNew')}
                backHref="/admin/notifications/templates"
            />

            <div className="mt-8">
                <TemplateEditor
                    type={type}
                    initialData={template ? JSON.parse(JSON.stringify(template)) : null}
                />
            </div>
        </PageContainer>
    );
}

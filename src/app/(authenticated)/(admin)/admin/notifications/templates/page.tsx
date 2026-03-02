import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Mail, Languages } from 'lucide-react';
import { NotificationTypeSchema, NotificationTemplate } from '@/lib/schemas/notifications';
import { getTranslations } from 'next-intl/server';
import { NotificationService } from '@/services/admin/NotificationService';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function NotificationTemplatesPage() {
    await requireRole([UserRole.SUPER_ADMIN]);

    const t = await getTranslations('admin.notifications.templates');

    // 1. Obtener templates existentes vía Service (Rule 11)
    const templates = await NotificationService.getTemplates();

    // 2. Detectar cuáles faltan por configurar
    const allTypes = NotificationTypeSchema.options;
    const configuredTypes = new Set(templates.map(t => t.type));
    const pendingTypes = allTypes.filter(t => !configuredTypes.has(t));

    // Helper para iconos/colores según tipo
    const getTypeMeta = (type: string) => {
        if (type.includes('BILLING')) return { color: 'text-amber-600', bg: 'bg-amber-50' };
        if (type.includes('RISK')) return { color: 'text-red-600', bg: 'bg-red-50' };
        return { color: 'text-slate-600', bg: 'bg-slate-50' };
    }

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                backHref="/admin/notifications"
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {/* Plantillas Existentes */}
                {templates.map((tpl: NotificationTemplate) => {
                    const meta = getTypeMeta(tpl.type);
                    const langCount = Object.keys(tpl.subjectTemplates || {}).length;

                    return (
                        <Card key={tpl._id.toString()} className="hover:shadow-md transition-all border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className={`p-2 rounded-xl ${meta.bg}`}>
                                    <Mail className={`h-5 w-5 ${meta.color}`} />
                                </div>
                                {tpl.active ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50">{t('active')}</Badge>
                                ) : (
                                    <Badge variant="secondary">{t('inactive')}</Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-lg mb-2 font-bold">{tpl.name}</CardTitle>
                                <CardDescription className="mb-4 text-xs font-mono opacity-70">{tpl.type}</CardDescription>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                                    <Languages className="h-4 w-4" />
                                    <span>{langCount} {t('languagesConfigured')}</span>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 mb-4 font-medium uppercase tracking-wider">
                                    <span>v{tpl.version}</span>
                                    <span>{t('updated')} {new Date(tpl.updatedAt).toLocaleDateString()}</span>
                                </div>

                                <Link href={`/admin/notifications/templates/${tpl.type}`}>
                                    <Button className="w-full rounded-xl font-bold" variant="secondary">{t('configure')}</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Plantillas Pendientes (Ghost Cards) */}
                {pendingTypes.map((type) => (
                    <Card key={type} className="border-dashed border-2 opacity-60 hover:opacity-100 hover:border-primary/40 transition-all rounded-3xl bg-transparent">
                        <CardHeader>
                            <Badge variant="outline" className="w-fit mb-2 font-bold uppercase text-[9px] tracking-widest">{t('pending')}</Badge>
                            <CardTitle className="text-lg font-bold">{type}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-6">{t('fallbackMessage')}</p>
                            <Link href={`/admin/notifications/templates/${type}`}>
                                <Button className="w-full border-dashed rounded-xl h-11" variant="outline">
                                    <Mail className="h-4 w-4 mr-2 opacity-50" />
                                    {t('createTemplate')}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}

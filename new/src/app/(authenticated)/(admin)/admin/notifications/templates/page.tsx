import { connectLogsDB } from '@/lib/db';
import { ContentCard } from '@/components/ui/content-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Edit, Mail, Languages, ChevronLeft } from 'lucide-react';
import { NotificationTypeSchema } from '@/lib/schemas';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function NotificationTemplatesPage() {
    const db = await connectLogsDB();

    // 1. Obtener templates existentes
    const templates = await db.collection('notification_templates')
        .find({})
        .sort({ type: 1 })
        .toArray();

    // 2. Detectar cuáles faltan por configurar
    const allTypes = NotificationTypeSchema.options;
    const configuredTypes = new Set(templates.map(t => t.type));
    const pendingTypes = allTypes.filter(t => !configuredTypes.has(t));

    return (
        <PageContainer>
            <PageHeader
                title="Plantillas de"
                highlight="Email"
                subtitle="Personaliza el HTML base y textos legales para cada tipo de notificación."
                actions={
                    <Link href="/admin/notifications">
                        <Button variant="outline" size="sm" className="rounded-xl">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Panel Notificaciones
                        </Button>
                    </Link>
                }
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Plantillas Existentes */}
                {templates.map((tpl: any) => {
                    const langCount = Object.keys(tpl.subjectTemplates || {}).length;

                    return (
                        <ContentCard
                            key={tpl._id.toString()}
                            className="hover:shadow-md transition-all group border-border/50"
                            noPadding
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    {tpl.active ? (
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/10 dark:border-emerald-500/20">Activa</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactiva</Badge>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-foreground group-hover:text-teal-600 transition-colors uppercase tracking-tight">
                                        {tpl.name}
                                    </h3>
                                    <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                                        {tpl.type}
                                    </code>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Languages className="h-4 w-4" />
                                    <span>{langCount} idiomas configurados</span>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 border-t border-border pt-4">
                                    <span className="font-mono">VERSIÓN v{tpl.version}</span>
                                    <span>{new Date(tpl.updatedAt).toLocaleDateString()}</span>
                                </div>

                                <Link href={`/admin/notifications/templates/${tpl.type}`} className="block">
                                    <Button className="w-full rounded-xl" variant="secondary">Configurar</Button>
                                </Link>
                            </div>
                        </ContentCard>
                    );
                })}

                {/* Plantillas Pendientes (Ghost Cards) */}
                {pendingTypes.map((type) => (
                    <ContentCard
                        key={type}
                        className="border-dashed border-2 opacity-60 hover:opacity-100 hover:border-teal-500/40 transition-all bg-muted/30"
                        noPadding
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">Pendiente</Badge>
                                <Edit className="h-4 w-4 text-muted-foreground/40" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-muted-foreground uppercase">{type}</h3>
                                <p className="text-xs text-muted-foreground/70 mt-2 leading-relaxed">
                                    Esta notificación usa el fallback genérico. Configúrala para personalizarla.
                                </p>
                            </div>

                            <Link href={`/admin/notifications/templates/${type}`} className="block pt-2">
                                <Button className="w-full border-dashed rounded-xl" variant="outline">
                                    Crear Plantilla
                                </Button>
                            </Link>
                        </div>
                    </ContentCard>
                ))}
            </div>
        </PageContainer>
    );
}

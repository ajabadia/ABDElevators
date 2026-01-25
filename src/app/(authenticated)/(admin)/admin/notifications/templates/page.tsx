import { connectDB } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Edit, Mail, Languages } from 'lucide-react';
import { NotificationTypeSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export default async function NotificationTemplatesPage() {
    const db = await connectDB();

    // 1. Obtener templates existentes
    const templates = await db.collection('system_email_templates')
        .find({})
        .sort({ type: 1 })
        .toArray();

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
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/notifications">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Plantillas de Email</h1>
                    <p className="text-slate-500 mt-2">Personaliza el HTML base y textos legales para cada tipo de notificación.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Plantillas Existentes */}
                {templates.map((tpl: any) => {
                    const meta = getTypeMeta(tpl.type);
                    const langCount = Object.keys(tpl.subjectTemplates || {}).length;

                    return (
                        <Card key={tpl._id.toString()} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className={`p-2 rounded-lg ${meta.bg}`}>
                                    <Mail className={`h-5 w-5 ${meta.color}`} />
                                </div>
                                {tpl.active ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200">Activa</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactiva</Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-lg mb-2">{tpl.name}</CardTitle>
                                <CardDescription className="mb-4 text-xs font-mono">{tpl.type}</CardDescription>

                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                                    <Languages className="h-4 w-4" />
                                    <span>{langCount} idiomas configurados</span>
                                </div>

                                <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
                                    <span>v{tpl.version}</span>
                                    <span>Actualizado: {new Date(tpl.updatedAt).toLocaleDateString()}</span>
                                </div>

                                <Link href={`/admin/notifications/templates/${tpl.type}`}>
                                    <Button className="w-full" variant="secondary">Configurar</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Plantillas Pendientes (Ghost Cards) */}
                {pendingTypes.map((type) => (
                    <Card key={type} className="border-dashed border-2 opacity-70 hover:opacity-100 hover:border-slate-400 transition-all">
                        <CardHeader>
                            <Badge variant="outline" className="w-fit mb-2">Pendiente</Badge>
                            <CardTitle className="text-lg">{type}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 mb-6">Esta notificación usa el fallback genérico del sistema. Configúrala para personalizarla.</p>
                            <Link href={`/admin/notifications/templates/${type}`}>
                                <Button className="w-full border-dashed" variant="outline">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Crear Plantilla
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

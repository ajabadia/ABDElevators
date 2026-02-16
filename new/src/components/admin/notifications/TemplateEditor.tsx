"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContentCard } from '@/components/ui/content-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, History, RefreshCcw, Code, FileText, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TemplateEditorProps {
    type: string;
    initialData: any; // NotificationTemplate | null
}

export function TemplateEditor({ type, initialData }: TemplateEditorProps) {
    const { toast } = useToast();
    const router = useRouter();

    // State
    const [activeLang, setActiveLang] = useState('es');
    const [isSaving, setIsSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        subjectTemplates: initialData?.subjectTemplates || { es: '', en: '' },
        bodyHtmlTemplates: initialData?.bodyHtmlTemplates || { es: '<p>Hola {{tenantName}},</p>', en: '<p>Hello {{tenantName}},</p>' },
        description: initialData?.description || '',
        active: initialData?.active ?? true,
        reason: '' // For Audit
    });

    const handleChange = (field: string, lang: string | null, value: any) => {
        if (lang) {
            setFormData(prev => ({
                ...prev,
                [field]: {
                    ...prev[field as keyof typeof prev],
                    [lang]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        if (!formData.reason && initialData) {
            toast({
                title: "Motivo requerido",
                description: "Por favor indica el motivo del cambio para la auditoría.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/notifications/templates/${type}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Error al guardar');

            toast({
                title: "Cambios guardados",
                description: "La plantilla se ha actualizado y versionado correctamente.",
            });

            router.refresh();

        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar la plantilla.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-2 space-y-6">
                <ContentCard
                    title="Editor de Contenido"
                    icon={<Code className="w-5 h-5 text-teal-600" />}
                    description="Define el asunto y el HTML del email. Puedes usar variables dinámicas."
                >
                    <Tabs value={activeLang} onValueChange={setActiveLang} className="space-y-6">
                        <TabsList className="bg-muted p-1 rounded-2xl border border-border w-fit flex justify-start">
                            <TabsTrigger value="es" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Español (ES)
                            </TabsTrigger>
                            <TabsTrigger value="en" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Inglés (EN)
                            </TabsTrigger>
                        </TabsList>

                        {['es', 'en'].map(lang => (
                            <TabsContent
                                key={lang}
                                value={lang}
                                className="space-y-6 outline-none animate-in fade-in duration-300"
                            >
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        Asunto del Email ({lang.toUpperCase()})
                                    </Label>
                                    <Input
                                        value={formData.subjectTemplates[lang] || ''}
                                        onChange={(e) => handleChange('subjectTemplates', lang, e.target.value)}
                                        placeholder={lang === 'es' ? 'Ej: Su factura {{invoiceId}} está lista' : 'Ex: Your invoice {{invoiceId}} is ready'}
                                        className="h-11 rounded-xl bg-muted/30 border-border focus:ring-teal-500/20"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        Cuerpo HTML ({lang.toUpperCase()})
                                    </Label>
                                    <Textarea
                                        className="font-mono text-xs min-h-[450px] rounded-xl bg-muted/30 border-border focus:ring-teal-500/20 p-4 leading-relaxed"
                                        value={formData.bodyHtmlTemplates[lang] || ''}
                                        onChange={(e) => handleChange('bodyHtmlTemplates', lang, e.target.value)}
                                    />
                                    <div className="flex items-start gap-2 p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl">
                                        <AlertCircle className="w-4 h-4 text-teal-600 mt-0.5" />
                                        <p className="text-[11px] text-muted-foreground">
                                            Soporta HTML básico y Handlebars. Asegúrate de incluir <code>{`{{tenant_custom_note}}`}</code> si deseas permitir personalización del cliente.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </ContentCard>

                <ContentCard
                    title="Auditoría de Cambios"
                    icon={<FileText className="w-5 h-5 text-teal-600" />}
                >
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold">
                                Motivo de la actualización <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="Ej: Actualización de términos legales 2026, Corrección de errata..."
                                value={formData.reason}
                                onChange={(e) => handleChange('reason', null, e.target.value)}
                                className="h-11 rounded-xl bg-muted/30 border-border"
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full sm:w-auto h-11 px-8 rounded-xl bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/10"
                            >
                                {isSaving ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Versión v{(initialData?.version || 0) + 1}
                            </Button>
                        </div>
                    </div>
                </ContentCard>
            </div>

            <div className="space-y-6">
                <ContentCard
                    title="Variables"
                    icon={<Info className="w-5 h-5 text-teal-600" />}
                >
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {['tenantName', 'date', 'tenant_custom_note', 'link'].map(v => (
                                <Badge
                                    key={v}
                                    variant="secondary"
                                    className="font-mono cursor-pointer hover:bg-teal-500/10 hover:text-teal-600 transition-colors py-1.5 px-3 rounded-lg border-transparent hover:border-teal-500/20"
                                >
                                    {`{{${v}}}`}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                            Haz clic para copiar. Estas variables se rellenarán automáticamente al realizar el envío de la notificación.
                        </p>
                    </div>
                </ContentCard>

                {initialData && (
                    <ContentCard
                        title="Versión"
                        icon={<History className="w-5 h-5 text-teal-600" />}
                    >
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground uppercase tracking-wider font-semibold">Versión Actual</span>
                                <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-border">v{initialData.version}</Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground uppercase tracking-wider font-semibold">Última Modificación</span>
                                <span className="text-foreground">{new Date(initialData.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground uppercase tracking-wider font-semibold">Modificado Por</span>
                                <span className="text-foreground truncate ml-4 font-medium">{initialData.updatedBy}</span>
                            </div>
                            <Button variant="outline" className="w-full mt-4 rounded-xl border-border hover:bg-muted text-muted-foreground" disabled>
                                <History className="mr-2 h-4 w-4" />
                                Ver Historial Completo
                            </Button>
                        </div>
                    </ContentCard>
                )}
            </div>
        </div>
    );
}
